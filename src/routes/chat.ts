import { Router } from 'express';
import {
  handleTelegramAction,
  updateQuickReplies,
  updateOperatorInfo,
} from '../controllers/chatController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public chat endpoint (GET and POST)
router.get('/', handleTelegramAction);
router.post('/', handleTelegramAction);

// Admin endpoints for settings
router.put('/quick-replies', authenticate, requireAdmin, updateQuickReplies);
router.put('/operator-info', authenticate, requireAdmin, updateOperatorInfo);

export default router;
