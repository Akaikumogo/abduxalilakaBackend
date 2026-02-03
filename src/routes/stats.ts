import { Router } from 'express';
import {
  getStats,
  getStatsAdmin,
  upsertStat,
  updateAllStats,
  deleteStat,
  reorderStats,
} from '../controllers/statsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint - get stats for frontend
router.get('/', getStats);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getStatsAdmin);
router.post('/', authenticate, requireAdmin, upsertStat);
router.put('/all', authenticate, requireAdmin, updateAllStats);
router.put('/reorder', authenticate, requireAdmin, reorderStats);
router.delete('/:id', authenticate, requireAdmin, deleteStat);

export default router;
