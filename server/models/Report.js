const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reportedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    reportedConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'hate_speech', 'violence', 'scam', 'impersonation', 'illegal_content', 'other'],
      required: true,
    },
    details: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed', 'escalated'],
      default: 'pending',
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warning_sent', 'content_removed', 'user_suspended', 'user_banned', 'dismissed'],
      default: 'none',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
