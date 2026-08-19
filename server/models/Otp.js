const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['phone', 'email'],
    default: 'phone',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Otp', otpSchema);
