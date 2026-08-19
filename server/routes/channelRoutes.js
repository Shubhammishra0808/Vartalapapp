const express = require('express');
const router = express.Router();
const {
  createChannel,
  exploreChannels,
  toggleSubscribe,
} = require('../controllers/channelController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createChannel);
router.get('/explore', exploreChannels);
router.post('/:id/subscribe', toggleSubscribe);

module.exports = router;
