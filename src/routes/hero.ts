import { Router } from 'express';
import {
  getHeroSettings,
  uploadHeroImage,
  deleteHeroImage,
  getHeroImage,
} from '../controllers/heroController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadHero } from '../middleware/upload.js';

const router = Router();

// Public endpoint - get hero image for frontend
router.get('/image', getHeroImage);

// Admin endpoints
router.get('/settings', authenticate, requireAdmin, getHeroSettings);
router.post('/upload', authenticate, requireAdmin, uploadHero.single('image'), uploadHeroImage);
router.delete('/image/:language', authenticate, requireAdmin, deleteHeroImage);

export default router;
