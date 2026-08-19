const express = require('express');
const router = express.Router();
const {
  createGroup,
  updateGroup,
  manageMembers,
  joinByInvite,
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createGroup);
router.put('/:id', updateGroup);
router.post('/:id/members', manageMembers);
router.post('/join/:code', joinByInvite);

module.exports = router;
