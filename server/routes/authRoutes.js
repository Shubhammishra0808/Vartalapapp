const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  getQrCode,
  qrLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Dual Verification Endpoints (Email & Mobile)
router.post('/send-email-otp', authLimiter, sendEmailOtp);
router.post('/verify-email-otp', authLimiter, verifyEmailOtp);
router.post('/send-otp', authLimiter, sendPhoneOtp);
router.post('/verify-otp', authLimiter, verifyPhoneOtp);

// QR Login
router.get('/qr-code', getQrCode);
router.post('/qr-login', qrLogin);

router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
