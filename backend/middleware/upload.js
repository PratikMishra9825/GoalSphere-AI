const multer = require('multer');

// Store files in memory as Buffers for high-performance direct streaming
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB max file size limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept common web image formats
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported (JPG, PNG, WEBP)'), false);
    }
  }
});

module.exports = upload;
