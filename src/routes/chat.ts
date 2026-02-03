import { Router } from 'express';
import {
  handleTelegramAction,
  updateQuickReplies,
  updateOperatorInfo,
  getConversations,
  getChatHistory,
  sendAdminReply,
  deleteConversation,
  getUnreadCount,
} from '../controllers/chatController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public chat endpoint (GET and POST)
router.get('/', handleTelegramAction);
router.post('/', handleTelegramAction);

// Admin endpoints for chat management
router.get('/admin/conversations', authenticate, requireAdmin, getConversations);
router.get('/admin/unread-count', authenticate, requireAdmin, getUnreadCount);
router.get('/admin/history/:odId', authenticate, requireAdmin, getChatHistory);
router.post('/admin/reply/:odId', authenticate, requireAdmin, sendAdminReply);
router.delete('/admin/conversation/:odId', authenticate, requireAdmin, deleteConversation);

// Admin endpoints for settings
router.put('/quick-replies', authenticate, requireAdmin, updateQuickReplies);
router.put('/operator-info', authenticate, requireAdmin, updateOperatorInfo);

export default router;
