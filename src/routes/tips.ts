import { Router } from 'express';
import {
  getTips,
  getTipsAdmin,
  upsertTip,
  deleteTip,
  reorderTips,
} from '../controllers/tipsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoints
router.get('/', getTips);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getTipsAdmin);
router.post('/', authenticate, requireAdmin, upsertTip);
router.delete('/:id', authenticate, requireAdmin, deleteTip);
router.put('/reorder', authenticate, requireAdmin, reorderTips);

export default router;
