import { Router } from 'express';
import { getAboutSettings, updateAboutSettings } from '../controllers/aboutController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint
router.get('/', getAboutSettings);

// Admin endpoint
router.put('/', authenticate, requireAdmin, updateAboutSettings);

export default router;

