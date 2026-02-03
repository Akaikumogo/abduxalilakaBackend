import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getTestimonials,
  getTestimonialsAdmin,
  upsertTestimonial,
  uploadTestimonialAvatar,
  deleteTestimonialAvatar,
  deleteTestimonial,
  reorderTestimonials,
} from '../controllers/testimonialsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'testimonials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for testimonial avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
router.get('/', getTestimonials);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getTestimonialsAdmin);
router.post('/', authenticate, requireAdmin, upsertTestimonial);
router.post('/:id/avatar', authenticate, requireAdmin, upload.single('avatar'), uploadTestimonialAvatar);
router.delete('/:id/avatar', authenticate, requireAdmin, deleteTestimonialAvatar);
router.delete('/:id', authenticate, requireAdmin, deleteTestimonial);
router.put('/reorder', authenticate, requireAdmin, reorderTestimonials);

export default router;
