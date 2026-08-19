const express = require('express');
const router = express.Router();
const { getCallHistory, logCall } = require('../controllers/callController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/history', getCallHistory);
router.post('/log', logCall);

module.exports = router;
