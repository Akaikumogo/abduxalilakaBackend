import { Router } from 'express';
import { body } from 'express-validator';
import {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  getStats,
} from '../controllers/applicationController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public route - create application
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
  ],
  createApplication
);

// Protected routes - admin only
router.get('/', authenticate, requireAdmin, getApplications);
router.get('/stats', authenticate, requireAdmin, getStats);
router.get('/:id', authenticate, requireAdmin, getApplication);
router.put('/:id', authenticate, requireAdmin, updateApplication);
router.delete('/:id', authenticate, requireAdmin, deleteApplication);

export default router;
