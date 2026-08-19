const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Relaxed for seamless testing & development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in a few minutes.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded. Please slow down your requests.',
  },
});

const messageLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Spam prevention: Sending messages too quickly.',
  },
});

module.exports = { authLimiter, apiLimiter, messageLimiter };
