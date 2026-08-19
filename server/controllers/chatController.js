const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc Get all conversations for current user
// @route GET /api/chats
exports.getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      'participants.user': userId,
      isDeletedBy: { $ne: userId },
    })
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage')
      .populate('groupInfo.createdBy', 'name username')
      .populate('channelInfo.createdBy', 'name username')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create or get direct conversation with another user
// @route POST /api/chats/direct
exports.getOrCreateDirectChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required.' });
    }

    if (recipientId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create a direct conversation with yourself.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isSuspended) {
      return res.status(404).json({ success: false, message: 'User not found or suspended.' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      type: 'direct',
      'participants.user': { $all: [currentUserId, recipientId] },
    })
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage');

    if (conversation) {
      // Un-delete if previously deleted by current user
      if (conversation.isDeletedBy.includes(currentUserId)) {
        conversation.isDeletedBy = conversation.isDeletedBy.filter((id) => id.toString() !== currentUserId.toString());
        await conversation.save();
      }

      return res.status(200).json({
        success: true,
        conversation,
      });
    }

    // Create new direct conversation
    conversation = await Conversation.create({
      type: 'direct',
      participants: [
        { user: currentUserId, role: 'member' },
        { user: recipientId, role: 'member' },
      ],
      lastMessageAt: new Date(),
    });

    conversation = await Conversation.findById(conversation._id).populate(
      'participants.user',
      'name username avatar isOnline lastSeen bio publicKey keyFingerprint'
    );

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get conversation details by ID
// @route GET /api/chats/:id
exports.getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage')
      .populate('pinnedMessages');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.participants.some(
      (p) => p.user._id.toString() === req.user._id.toString()
    );

    if (!isMember && conversation.type !== 'channel') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat.' });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Set conversation disappearing message timer or theme
// @route PUT /api/chats/:id/settings
exports.updateChatSettings = async (req, res, next) => {
  try {
    const { disappearingTime, themeColor } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (disappearingTime !== undefined) conversation.disappearingTime = disappearingTime;
    if (themeColor !== undefined) conversation.themeColor = themeColor;

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Chat settings updated.',
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle archive conversation
// @route POST /api/chats/:id/archive
exports.toggleArchiveChat = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    const userId = req.user._id;

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isArchived = conversation.isArchivedBy.includes(userId);
    if (isArchived) {
      conversation.isArchivedBy = conversation.isArchivedBy.filter((id) => id.toString() !== userId.toString());
    } else {
      conversation.isArchivedBy.push(userId);
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      isArchived: !isArchived,
      message: isArchived ? 'Chat unarchived.' : 'Chat archived.',
    });
  } catch (error) {
    next(error);
  }
};
