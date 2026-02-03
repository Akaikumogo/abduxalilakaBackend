import { Router } from 'express';
import {
  getFaqSettings,
  updateFaqSettings,
  getFaqs,
  getFaqsAdmin,
  upsertFaq,
  deleteFaq,
  reorderFaqs,
} from '../controllers/faqController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoints
router.get('/settings', getFaqSettings);
router.get('/', getFaqs);

// Admin endpoints
router.put('/settings', authenticate, requireAdmin, updateFaqSettings);
router.get('/admin', authenticate, requireAdmin, getFaqsAdmin);
router.post('/', authenticate, requireAdmin, upsertFaq);
router.delete('/:id', authenticate, requireAdmin, deleteFaq);
router.put('/reorder', authenticate, requireAdmin, reorderFaqs);

export default router;
