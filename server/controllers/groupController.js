const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc Create a group
// @route POST /api/groups
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, avatar, memberIds = [], permissions } = req.body;
    const creatorId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    // Build participants array
    const participants = [{ user: creatorId, role: 'creator' }];
    
    // Add other members
    memberIds.forEach((id) => {
      if (id.toString() !== creatorId.toString()) {
        participants.push({ user: id, role: 'member' });
      }
    });

    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const group = await Conversation.create({
      type: 'group',
      participants,
      groupInfo: {
        name,
        description: description || '',
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        inviteCode,
        permissions: permissions || {
          sendMessages: true,
          editInfo: false,
          addMembers: true,
          sendMedia: true,
          startCalls: true,
          createPolls: true,
        },
        createdBy: creatorId,
      },
      lastMessageAt: new Date(),
    });

    // Create system welcome message
    const sysMsg = await Message.create({
      conversation: group._id,
      sender: creatorId,
      type: 'system',
      content: `${req.user.name} created the group "${name}".`,
    });

    group.lastMessage = sysMsg._id;
    await group.save();

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage');

    res.status(201).json({
      success: true,
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update group details
// @route PUT /api/groups/:id
exports.updateGroup = async (req, res, next) => {
  try {
    const { name, description, avatar, permissions } = req.body;
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const participant = group.participants.find((p) => p.user.toString() === userId.toString());
    if (!participant) {
      return res.status(403).json({ success: false, message: 'You are not in this group.' });
    }

    const isAdmin = participant.role === 'creator' || participant.role === 'admin';
    if (!isAdmin && !group.groupInfo.permissions.editInfo) {
      return res.status(403).json({ success: false, message: 'Only admins can edit group info.' });
    }

    if (name) group.groupInfo.name = name;
    if (description !== undefined) group.groupInfo.description = description;
    if (avatar) group.groupInfo.avatar = avatar;
    if (permissions && isAdmin) {
      group.groupInfo.permissions = { ...group.groupInfo.permissions, ...permissions };
    }

    await group.save();

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add or Remove group members
// @route POST /api/groups/:id/members
exports.manageMembers = async (req, res, next) => {
  try {
    const { action, targetUserId, newRole } = req.body; // action: 'add' | 'remove' | 'promote' | 'demote'
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || group.type !== 'group') {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const currentParticipant = group.participants.find((p) => p.user.toString() === userId.toString());
    if (!currentParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a member.' });
    }

    const isAdmin = currentParticipant.role === 'creator' || currentParticipant.role === 'admin';

    if (action === 'add') {
      if (!isAdmin && !group.groupInfo.permissions.addMembers) {
        return res.status(403).json({ success: false, message: 'Only admins can add members.' });
      }
      const alreadyMember = group.participants.some((p) => p.user.toString() === targetUserId);
      if (!alreadyMember) {
        group.participants.push({ user: targetUserId, role: 'member' });
      }
    } else if (action === 'remove') {
      if (!isAdmin && targetUserId !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Only admins can remove members.' });
      }
      group.participants = group.participants.filter((p) => p.user.toString() !== targetUserId);
    } else if (action === 'promote' || action === 'demote') {
      if (currentParticipant.role !== 'creator' && currentParticipant.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only creator/admin can change roles.' });
      }
      const member = group.participants.find((p) => p.user.toString() === targetUserId);
      if (member) {
        member.role = newRole || (action === 'promote' ? 'admin' : 'member');
      }
    }

    await group.save();

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Join group by invite code
// @route POST /api/groups/join/:code
exports.joinByInvite = async (req, res, next) => {
  try {
    const inviteCode = req.params.code.toUpperCase();
    const userId = req.user._id;

    const group = await Conversation.findOne({
      type: 'group',
      'groupInfo.inviteCode': inviteCode,
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link.' });
    }

    const alreadyMember = group.participants.some((p) => p.user.toString() === userId.toString());
    if (alreadyMember) {
      return res.status(200).json({ success: true, group });
    }

    group.participants.push({ user: userId, role: 'member' });
    await group.save();

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants.user', 'name username avatar isOnline lastSeen bio publicKey keyFingerprint')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      message: `Joined ${group.groupInfo.name}!`,
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};
