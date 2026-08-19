const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${sanitizedExt}`);
  },
});

// File filter for safe MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/aac',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File format '${file.mimetype}' is not permitted for security reasons.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 30) * 1024 * 1024, // 30MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;
