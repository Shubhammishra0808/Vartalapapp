const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  reactToMessage,
  votePoll,
  deleteMessage,
  toggleStarMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', messageLimiter, sendMessage);
router.post('/:id/react', reactToMessage);
router.post('/:id/poll/vote', votePoll);
router.delete('/:id', deleteMessage);
router.post('/:id/star', toggleStarMessage);

module.exports = router;
