const multer = require('multer');
const AppError = require('../utils/appError');

// Use memory storage — files are kept as Buffers and uploaded to Cloudinary.
// This works on Vercel (no disk writes) and any other serverless environment.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed!', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
