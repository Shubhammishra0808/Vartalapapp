const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Conversation = require('../models/Conversation');

// @desc Search or discover users with relationship status
// @route GET /api/users/search?q=query
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    const filter = {
      _id: { $ne: currentUserId, $nin: currentUser.blockedUsers || [] },
      isSuspended: false,
    };

    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('name username avatar bio headline statusMessage isOnline lastSeen publicKey keyFingerprint isPrivateAccount privacySettings')
      .sort({ isOnline: -1, createdAt: -1 })
      .limit(30);

    // Fetch all active friend requests involving current user
    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: currentUserId, status: 'pending' },
        { recipient: currentUserId, status: 'pending' },
      ],
    });

    const sanitizedUsers = users
      .map((u) => {
        const uIdStr = u._id.toString();
        const isContact = currentUser.contacts?.some((c) => c.user?.toString() === uIdStr);
        const isBlockedMe = u.blockedUsers?.some((b) => b.toString() === currentUserId.toString());
        if (isBlockedMe) return null;

        let avatar = u.avatar;
        let lastSeen = u.lastSeen;
        let isOnline = u.isOnline;

        if (u.privacySettings?.profilePhoto === 'nobody' || (u.privacySettings?.profilePhoto === 'contacts' && !isContact)) {
          avatar = '';
        }
        if (u.privacySettings?.lastSeen === 'nobody' || (u.privacySettings?.lastSeen === 'contacts' && !isContact)) {
          lastSeen = null;
        }
        if (u.privacySettings?.onlineStatus === 'nobody' || (u.privacySettings?.onlineStatus === 'contacts' && !isContact)) {
          isOnline = false;
        }

        // Determine friendship status
        let friendStatus = 'none';
        let requestId = null;

        if (isContact) {
          friendStatus = 'friends';
        } else {
          const outgoingReq = pendingRequests.find((r) => r.recipient.toString() === uIdStr);
          const incomingReq = pendingRequests.find((r) => r.sender.toString() === uIdStr);

          if (outgoingReq) {
            friendStatus = 'pending_outgoing';
            requestId = outgoingReq._id;
          } else if (incomingReq) {
            friendStatus = 'pending_incoming';
            requestId = incomingReq._id;
          }
        }

        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          avatar,
          bio: u.bio,
          headline: u.headline,
          statusMessage: u.statusMessage,
          isOnline,
          lastSeen,
          isPrivateAccount: u.isPrivateAccount,
          isContact,
          friendStatus,
          requestId,
          publicKey: u.publicKey,
          keyFingerprint: u.keyFingerprint,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      users: sanitizedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get user profile by ID
// @route GET /api/users/:id
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name username avatar bio statusMessage isOnline lastSeen publicKey keyFingerprint isPrivateAccount privacySettings'
    );

    if (!user || user.isSuspended) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile (Name, bio, status, avatar)
// @route PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, statusMessage, avatar, phone, isPrivateAccount } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (statusMessage !== undefined) user.statusMessage = statusMessage;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (isPrivateAccount !== undefined) user.isPrivateAccount = isPrivateAccount;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update privacy and notification settings
// @route PUT /api/users/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { privacySettings, notificationSettings, customTheme, isPrivateAccount } = req.body;
    const user = await User.findById(req.user._id);

    if (privacySettings) {
      user.privacySettings = { ...user.privacySettings, ...privacySettings };
    }
    if (notificationSettings) {
      user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };
    }
    if (customTheme) {
      user.customTheme = { ...user.customTheme, ...customTheme };
    }
    if (isPrivateAccount !== undefined) {
      user.isPrivateAccount = isPrivateAccount;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings saved successfully.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update E2EE Public Key
// @route PUT /api/users/keys
exports.updatePublicKey = async (req, res, next) => {
  try {
    const { publicKey, keyFingerprint } = req.body;
    const user = await User.findById(req.user._id);

    user.publicKey = publicKey;
    if (keyFingerprint) user.keyFingerprint = keyFingerprint;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Public key updated for E2EE.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Block or Unblock user
// @route POST /api/users/block/:id
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(req.user._id);

    const isBlocked = user.blockedUsers.some((id) => id.toString() === targetUserId);

    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetUserId);
    } else {
      user.blockedUsers.push(targetUserId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isBlocked: !isBlocked,
      message: isBlocked ? 'User unblocked successfully.' : 'User blocked successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get blocked users list
// @route GET /api/users/blocked/list
exports.getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name username avatar');
    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc Send Connection / Chat Request
// @route POST /api/users/requests/send
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user._id;

    if (!recipientId || recipientId.toString() === senderId.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid recipient.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isSuspended) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if already friends/contacts
    const isAlreadyContact = req.user.contacts?.some((c) => c.user?.toString() === recipientId.toString());
    if (isAlreadyContact) {
      return res.status(400).json({ success: false, message: 'Already connected as contacts.' });
    }

    let request = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    });

    if (request) {
      if (request.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Request already pending.' });
      }
      request.status = 'pending';
      request.sender = senderId;
      request.recipient = recipientId;
      request.message = message || 'Hey! I would like to connect with you on SecureChat.';
      await request.save();
    } else {
      request = await FriendRequest.create({
        sender: senderId,
        recipient: recipientId,
        message: message || 'Hey! I would like to connect with you on SecureChat.',
      });
    }

    res.status(201).json({
      success: true,
      message: `Request sent to ${recipient.name}!`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get pending incoming & outgoing friend requests
// @route GET /api/users/requests/list
exports.getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const incoming = await FriendRequest.find({ recipient: userId, status: 'pending' })
      .populate('sender', 'name username avatar bio isOnline lastSeen')
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({ sender: userId, status: 'pending' })
      .populate('recipient', 'name username avatar bio isOnline lastSeen')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      incoming,
      outgoing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Accept or Decline friend request
// @route POST /api/users/requests/:id/respond
exports.respondFriendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { action } = req.body; // 'accept' | 'decline'
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.recipient.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // Add to contacts for both users
      const currentUser = await User.findById(userId);
      const senderUser = await User.findById(request.sender);

      if (!currentUser.contacts.some((c) => c.user?.toString() === request.sender.toString())) {
        currentUser.contacts.push({ user: request.sender });
        await currentUser.save();
      }

      if (!senderUser.contacts.some((c) => c.user?.toString() === userId.toString())) {
        senderUser.contacts.push({ user: userId });
        await senderUser.save();
      }

      // Auto-create or find direct chat conversation
      let conversation = await Conversation.findOne({
        type: 'direct',
        'participants.user': { $all: [userId, request.sender] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          type: 'direct',
          participants: [
            { user: userId, role: 'member' },
            { user: request.sender, role: 'member' },
          ],
          lastMessageAt: new Date(),
        });
      }

      const populatedConv = await Conversation.findById(conversation._id)
        .populate('participants.user', 'name username avatar isOnline lastSeen publicKey')
        .populate('lastMessage');

      return res.status(200).json({
        success: true,
        message: 'Request accepted! You can now chat securely.',
        conversation: populatedConv || conversation,
      });
    } else {
      request.status = 'declined';
      await request.save();

      return res.status(200).json({
        success: true,
        message: 'Request declined.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Cancel outgoing friend request
// @route POST /api/users/requests/:id/cancel
exports.cancelFriendRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user._id;

    const request = await FriendRequest.findOne({
      _id: requestId,
      sender: userId,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Pending request not found.' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      success: true,
      message: 'Friend request cancelled.',
    });
  } catch (error) {
    next(error);
  }
};

