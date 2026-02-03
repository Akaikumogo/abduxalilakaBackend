import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getCountries,
  getCountriesAdmin,
  upsertCountry,
  uploadCountryImage,
  deleteCountryImage,
  deleteCountry,
  reorderCountries,
} from '../controllers/countriesController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'countries');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for country images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `country-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Public endpoints
router.get('/', getCountries);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getCountriesAdmin);
router.post('/', authenticate, requireAdmin, upsertCountry);
router.post('/:id/image', authenticate, requireAdmin, upload.single('image'), uploadCountryImage);
router.delete('/:id/image/:language', authenticate, requireAdmin, deleteCountryImage);
router.delete('/:id', authenticate, requireAdmin, deleteCountry);
router.put('/reorder', authenticate, requireAdmin, reorderCountries);

export default router;
