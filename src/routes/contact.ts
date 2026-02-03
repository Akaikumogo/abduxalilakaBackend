import { Router } from 'express';
import {
  getContactSettings,
  updateContactSettings,
} from '../controllers/contactController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint
router.get('/', getContactSettings);

// Admin endpoint
router.put('/', authenticate, requireAdmin, updateContactSettings);

export default router;
