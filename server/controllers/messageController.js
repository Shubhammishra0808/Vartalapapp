const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc Get messages for a conversation
// @route GET /api/messages/:conversationId
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name username avatar')
      .populate('replyTo')
      .populate('reactions.user', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
        $set: { status: 'read' },
      }
    );

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Send a message
// @route POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const {
      conversationId,
      content,
      type = 'text',
      isEncrypted = false,
      encryptedPayload,
      nonce,
      mediaUrl,
      mediaMeta,
      location,
      contactCard,
      poll,
      replyTo,
    } = req.body;

    const senderId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Check permissions if group
    if (conversation.type === 'group') {
      const participant = conversation.participants.find(
        (p) => p.user.toString() === senderId.toString()
      );
      if (!participant) {
        return res.status(403).json({ success: false, message: 'You are not a member of this group.' });
      }
      if (!conversation.groupInfo?.permissions?.sendMessages && participant.role === 'member') {
        return res.status(403).json({ success: false, message: 'Only admins can send messages in this group.' });
      }
    }

    // Calculate expiration if disappearing messages are enabled
    let expiresAt = null;
    if (conversation.disappearingTime && conversation.disappearingTime > 0) {
      expiresAt = new Date(Date.now() + conversation.disappearingTime * 1000);
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      type,
      content: content || '',
      isEncrypted,
      encryptedPayload: encryptedPayload || '',
      nonce: nonce || '',
      mediaUrl: mediaUrl || '',
      mediaMeta: mediaMeta || {},
      location: location || null,
      contactCard: contactCard || null,
      poll: poll || null,
      replyTo: replyTo || null,
      status: 'sent',
      deliveredTo: [{ user: senderId, deliveredAt: new Date() }],
      readBy: [{ user: senderId, readAt: new Date() }],
      expiresAt,
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username avatar')
      .populate('replyTo')
      .populate('reactions.user', 'name username avatar');

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc React to a message
// @route POST /api/messages/:id/react
exports.reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Toggle off
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change emoji
        message.reactions[existingReactionIndex].emoji = emoji;
        message.reactions[existingReactionIndex].createdAt = new Date();
      }
    } else {
      message.reactions.push({ emoji, user: userId });
    }

    await message.save();

    const updated = await Message.findById(messageId)
      .populate('sender', 'name username avatar')
      .populate('reactions.user', 'name username avatar');

    res.status(200).json({
      success: true,
      message: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Vote in poll
// @route POST /api/messages/:id/poll/vote
exports.votePoll = async (req, res, next) => {
  try {
    const { optionId } = req.body;
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || message.type !== 'poll' || !message.poll) {
      return res.status(404).json({ success: false, message: 'Poll not found.' });
    }

    if (message.poll.isClosed) {
      return res.status(400).json({ success: false, message: 'This poll has ended.' });
    }

    // Toggle vote
    message.poll.options.forEach((opt) => {
      const userIndex = opt.votes.findIndex((v) => v.toString() === userId.toString());
      if (opt.id === optionId) {
        if (userIndex > -1) {
          opt.votes.splice(userIndex, 1);
        } else {
          opt.votes.push(userId);
        }
      } else if (!message.poll.multipleAnswers) {
        // Remove vote from other options if single answer poll
        if (userIndex > -1) {
          opt.votes.splice(userIndex, 1);
        }
      }
    });

    await message.save();

    res.status(200).json({
      success: true,
      poll: message.poll,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete message (for everyone or for me)
// @route DELETE /api/messages/:id
exports.deleteMessage = async (req, res, next) => {
  try {
    const { deleteForEveryone } = req.body;
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (deleteForEveryone) {
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Only sender can delete for everyone.' });
      }
      message.isDeleted = true;
      message.content = '🚫 This message was deleted';
      message.mediaUrl = '';
      await message.save();
    } else {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Star / Bookmark message
// @route POST /api/messages/:id/star
exports.toggleStarMessage = async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const isStarred = message.starredBy.includes(userId);
    if (isStarred) {
      message.starredBy = message.starredBy.filter((id) => id.toString() !== userId.toString());
    } else {
      message.starredBy.push(userId);
    }

    await message.save();

    res.status(200).json({
      success: true,
      isStarred: !isStarred,
    });
  } catch (error) {
    next(error);
  }
};
