const Call = require('../models/Call');
const User = require('../models/User');

// @desc Get call logs for user
// @route GET /api/calls/history
exports.getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }, { 'participants.user': userId }],
    })
      .populate('caller', 'name username avatar')
      .populate('receiver', 'name username avatar')
      .populate('participants.user', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      calls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Log a new call
// @route POST /api/calls/log
exports.logCall = async (req, res, next) => {
  try {
    const { receiverId, conversationId, type = 'voice', isGroupCall = false, status = 'connected', duration = 0 } = req.body;
    const callerId = req.user._id;

    const call = await Call.create({
      caller: callerId,
      receiver: receiverId || null,
      conversation: conversationId || null,
      type,
      isGroupCall,
      status,
      startedAt: new Date(Date.now() - duration * 1000),
      endedAt: new Date(),
      duration,
    });

    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'name username avatar')
      .populate('receiver', 'name username avatar');

    res.status(201).json({
      success: true,
      call: populatedCall,
    });
  } catch (error) {
    next(error);
  }
};
