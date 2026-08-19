const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      default: 'Hey! I would like to connect with you on SecureChat.',
      maxlength: 250,
    },
  },
  {
    timestamps: true,
  }
);

friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
