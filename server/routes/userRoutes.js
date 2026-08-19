const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getUserProfile,
  updateProfile,
  updateSettings,
  updatePublicKey,
  toggleBlockUser,
  getBlockedUsers,
  sendFriendRequest,
  getFriendRequests,
  respondFriendRequest,
  cancelFriendRequest,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchUsers);
router.get('/blocked/list', getBlockedUsers);
router.get('/requests/list', getFriendRequests);
router.post('/requests/send', sendFriendRequest);
router.post('/requests/:id/respond', respondFriendRequest);
router.post('/requests/:id/cancel', cancelFriendRequest);
router.delete('/requests/:id', cancelFriendRequest);
router.post('/block/:id', toggleBlockUser);

router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);
router.put('/settings', updateSettings);
router.put('/keys', updatePublicKey);

module.exports = router;
