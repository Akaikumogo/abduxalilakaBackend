import { Router } from 'express';
import {
  getSteps,
  getStepsAdmin,
  upsertStep,
  deleteStep,
  reorderSteps,
} from '../controllers/stepsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint
router.get('/', getSteps);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getStepsAdmin);
router.post('/', authenticate, requireAdmin, upsertStep);
router.delete('/:id', authenticate, requireAdmin, deleteStep);
router.put('/reorder', authenticate, requireAdmin, reorderSteps);

export default router;
