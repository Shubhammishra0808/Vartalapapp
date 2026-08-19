const express = require('express');
const router = express.Router();
const {
  getActiveStories,
  createStory,
  viewStory,
  deleteStory,
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getActiveStories);
router.post('/', createStory);
router.post('/:id/view', viewStory);
router.delete('/:id', deleteStory);

module.exports = router;
