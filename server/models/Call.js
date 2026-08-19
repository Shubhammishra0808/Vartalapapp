const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    type: {
      type: String,
      enum: ['voice', 'video'],
      default: 'voice',
    },
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['initiating', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'busy'],
      default: 'initiating',
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // In seconds
      default: 0,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['invited', 'accepted', 'rejected', 'left'],
          default: 'invited',
        },
        joinedAt: Date,
        leftAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Call', callSchema);
