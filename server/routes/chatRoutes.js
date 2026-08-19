const express = require('express');
const router = express.Router();
const {
  getUserConversations,
  getOrCreateDirectChat,
  getConversationById,
  updateChatSettings,
  toggleArchiveChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getUserConversations);
router.post('/direct', getOrCreateDirectChat);
router.get('/:id', getConversationById);
router.put('/:id/settings', updateChatSettings);
router.post('/:id/archive', toggleArchiveChat);

module.exports = router;
