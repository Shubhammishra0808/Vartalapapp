const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['creator', 'admin', 'moderator', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    muteUntil: {
      type: Date,
    },
    nickname: {
      type: String,
      default: '',
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group', 'channel'],
      required: true,
      default: 'direct',
    },
    participants: [participantSchema],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Group Information
    groupInfo: {
      name: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        default: '',
      },
      avatar: {
        type: String,
        default: '',
      },
      inviteCode: {
        type: String,
        unique: true,
        sparse: true,
      },
      permissions: {
        sendMessages: { type: Boolean, default: true },
        editInfo: { type: Boolean, default: false }, // Only admins by default
        addMembers: { type: Boolean, default: true },
        sendMedia: { type: Boolean, default: true },
        startCalls: { type: Boolean, default: true },
        createPolls: { type: Boolean, default: true },
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Channel Information
    channelInfo: {
      name: {
        type: String,
        trim: true,
      },
      username: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
      },
      description: {
        type: String,
        default: '',
      },
      avatar: {
        type: String,
        default: '',
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      subscribersCount: {
        type: Number,
        default: 1,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    disappearingTime: {
      type: Number, // In seconds, 0 = disabled
      default: 0,
    },
    isArchivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    themeColor: {
      type: String,
      default: '#6366f1',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying direct conversations
conversationSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
