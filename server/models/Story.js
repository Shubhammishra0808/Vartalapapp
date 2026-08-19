const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    content: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    backgroundColor: {
      type: String,
      default: '#4f46e5',
    },
    fontFamily: {
      type: String,
      default: 'sans',
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    privacy: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'contacts',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Story', storySchema);
