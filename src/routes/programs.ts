import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getPrograms,
  getProgramImage,
  getProgramsAdmin,
  upsertProgram,
  uploadProgramImage,
  deleteProgramImage,
  deleteProgram,
  reorderPrograms,
} from '../controllers/programsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'programs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for program images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `program-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
router.get('/', getPrograms);
router.get('/:id/image', getProgramImage);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getProgramsAdmin);
router.post('/', authenticate, requireAdmin, upsertProgram);
router.post('/:id/image', authenticate, requireAdmin, upload.single('image'), uploadProgramImage);
router.delete('/:id/image/:language', authenticate, requireAdmin, deleteProgramImage);
router.delete('/:id', authenticate, requireAdmin, deleteProgram);
router.put('/reorder', authenticate, requireAdmin, reorderPrograms);

export default router;
