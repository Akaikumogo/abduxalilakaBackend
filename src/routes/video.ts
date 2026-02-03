import { Router } from 'express';
import {
  getVideoSettings,
  updateVideoSettings,
} from '../controllers/videoController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint
router.get('/', getVideoSettings);

// Admin endpoint
router.put('/', authenticate, requireAdmin, updateVideoSettings);

export default router;
