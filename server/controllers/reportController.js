const Report = require('../models/Report');

// @desc Submit a report for spam/abuse
// @route POST /api/reports
exports.createReport = async (req, res, next) => {
  try {
    const { reportedUserId, reportedMessageId, reportedConversationId, reason, details } = req.body;
    const reporterId = req.user._id;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please select a reason for reporting.' });
    }

    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportedUserId || null,
      reportedMessage: reportedMessageId || null,
      reportedConversation: reportedConversationId || null,
      reason,
      details: details || '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will investigate promptly.',
      reportId: report._id,
    });
  } catch (error) {
    next(error);
  }
};
