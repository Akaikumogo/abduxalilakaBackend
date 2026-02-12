import { Router } from 'express';
import {
  getAboutSettings,
  updateAboutSettings,
  getAboutImages,
  getAboutImagesAdmin,
  uploadAboutImage,
  deleteAboutImage,
} from '../controllers/aboutController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public endpoints
router.get('/', getAboutSettings);
router.get('/images', getAboutImages);

// Admin endpoints
router.put('/', authenticate, requireAdmin, updateAboutSettings);
router.get('/images/admin', authenticate, requireAdmin, getAboutImagesAdmin);
router.post('/images', authenticate, requireAdmin, upload.single('image'), uploadAboutImage);
router.delete('/images/:id', authenticate, requireAdmin, deleteAboutImage);

export default router;

