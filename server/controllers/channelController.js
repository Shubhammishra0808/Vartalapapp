const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc Create a channel
// @route POST /api/channels
exports.createChannel = async (req, res, next) => {
  try {
    const { name, username, description, avatar, isPublic = true } = req.body;
    const creatorId = req.user._id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Channel name is required.' });
    }

    const channel = await Conversation.create({
      type: 'channel',
      participants: [{ user: creatorId, role: 'creator' }],
      channelInfo: {
        name,
        username: username ? username.toLowerCase() : undefined,
        description: description || '',
        avatar: avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`,
        isPublic,
        subscribersCount: 1,
        createdBy: creatorId,
      },
      lastMessageAt: new Date(),
    });

    const populatedChannel = await Conversation.findById(channel._id)
      .populate('participants.user', 'name username avatar')
      .populate('channelInfo.createdBy', 'name username');

    res.status(201).json({
      success: true,
      channel: populatedChannel,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get public channels list
// @route GET /api/channels/explore
exports.exploreChannels = async (req, res, next) => {
  try {
    const channels = await Conversation.find({
      type: 'channel',
      'channelInfo.isPublic': true,
    })
      .populate('channelInfo.createdBy', 'name username')
      .sort({ 'channelInfo.subscribersCount': -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      channels,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Subscribe/Unsubscribe to channel
// @route POST /api/channels/:id/subscribe
exports.toggleSubscribe = async (req, res, next) => {
  try {
    const channelId = req.params.id;
    const userId = req.user._id;

    const channel = await Conversation.findById(channelId);
    if (!channel || channel.type !== 'channel') {
      return res.status(404).json({ success: false, message: 'Channel not found.' });
    }

    const isSubscribed = channel.participants.some((p) => p.user.toString() === userId.toString());

    if (isSubscribed) {
      channel.participants = channel.participants.filter((p) => p.user.toString() !== userId.toString());
      channel.channelInfo.subscribersCount = Math.max(0, (channel.channelInfo.subscribersCount || 1) - 1);
    } else {
      channel.participants.push({ user: userId, role: 'member' });
      channel.channelInfo.subscribersCount = (channel.channelInfo.subscribersCount || 0) + 1;
    }

    await channel.save();

    res.status(200).json({
      success: true,
      isSubscribed: !isSubscribed,
      subscribersCount: channel.channelInfo.subscribersCount,
    });
  } catch (error) {
    next(error);
  }
};
