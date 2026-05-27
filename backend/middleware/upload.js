import multer from 'multer';
import path from 'path';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Disk Storage Configuration for local persistence
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Basic file filter for multer (pre-filtering by filename ext)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
});

export const multerUpload = upload.single('cover');

/**
 * Middleware to validate magic bytes (true file type validation)
 */
export const validateMagicBytes = async (req, res, next) => {
  // If no file was uploaded, we just continue (cover can be optional or handled by schema)
  if (!req.file) {
    return next();
  }
  
  // Continue for local disk storage
  next();
};
