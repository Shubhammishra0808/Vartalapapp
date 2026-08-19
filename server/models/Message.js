const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'voice', 'location', 'contact', 'poll', 'system'],
      default: 'text',
    },
    content: {
      type: String,
      default: '',
    },
    // View Once feature (Instagram / WhatsApp style: Photo/video disappears after opening 1 time)
    isViewOnce: {
      type: Boolean,
      default: false,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // End-to-End Encryption metadata
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptedPayload: {
      type: String,
      default: '',
    },
    nonce: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaMeta: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number,
      width: Number,
      height: Number,
      waveform: [Number],
    },
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      address: String,
    },
    contactCard: {
      name: String,
      phone: String,
      email: String,
      avatar: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    poll: {
      question: String,
      options: [
        {
          id: String,
          text: String,
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
        },
      ],
      multipleAnswers: { type: Boolean, default: false },
      isClosed: { type: Boolean, default: false },
      expiresAt: Date,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    forwarded: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
