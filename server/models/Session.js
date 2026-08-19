const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    deviceInfo: {
      browser: String,
      os: String,
      deviceType: String, // desktop, mobile, tablet
      deviceName: String,
      ipAddress: String,
      location: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
