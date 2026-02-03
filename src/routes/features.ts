import { Router } from 'express';
import {
  getFeatures,
  getFeaturesAdmin,
  upsertFeature,
  updateAllFeatures,
  deleteFeature,
  reorderFeatures,
} from '../controllers/featuresController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint - get features for frontend
router.get('/', getFeatures);

// Admin endpoints
router.get('/admin', authenticate, requireAdmin, getFeaturesAdmin);
router.post('/', authenticate, requireAdmin, upsertFeature);
router.put('/all', authenticate, requireAdmin, updateAllFeatures);
router.put('/reorder', authenticate, requireAdmin, reorderFeatures);
router.delete('/:id', authenticate, requireAdmin, deleteFeature);

export default router;
