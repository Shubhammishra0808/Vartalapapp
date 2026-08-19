const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });
});

module.exports = router;
