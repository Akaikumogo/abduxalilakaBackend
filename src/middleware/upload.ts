import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if not exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const heroDir = path.join(uploadsDir, 'hero');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(heroDir)) {
  fs.mkdirSync(heroDir, { recursive: true });
}

// File filter for images
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  }
};

// Storage configuration for hero images
const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, heroDir);
  },
  filename: (req, file, cb) => {
    const lang = req.body.language || 'uz';
    const ext = path.extname(file.originalname);
    const filename = `hero_${lang}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// Multer instance for hero images
export const uploadHero = multer({
  storage: heroStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// Generic storage for other uploads
const genericStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: genericStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});
