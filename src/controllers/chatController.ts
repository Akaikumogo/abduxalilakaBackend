import { Request, Response } from 'express';
import { ChatMessage, getSetting, setSetting } from '../models/index.js';
import { sendTelegramMessage, getTelegramUpdates } from '../services/telegram.js';

// Default quick replies
const DEFAULT_QUICK_REPLIES: Record<string, string> = {
  "Dasturlar haqida ma'lumot": "Bizning dasturlar:\n\n1. Language Preparation Courses\n2. Foundation Programme\n3. Bachelor's Degree\n4. Master's Degree",
  "Konsultatsiya olish": "Konsultatsiya olish uchun quyidagi formani to'ldiring",
  "Aloqa ma'lumotlari": "Aloqa ma'lumotlari:\n\n📞 Telefon: +998 71 200 08 11\n📧 Email: info@buranconsulting.uz\n📍 Manzil: Toshkent shahri"
};

// Default operator info
const DEFAULT_OPERATOR_INFO = {
  name: 'Operator Safia',
  role: 'User',
  telegram: '@buran_manager_sofia'
};

// ==================== ADMIN ENDPOINTS ====================

// Get all conversations (unique users with last message)
export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    // Aggregate to get unique users with their last message and unread count
    const conversations = await ChatMessage.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$createdAt' },
          lastMessageIsUser: { $first: '$isUser' },
          totalMessages: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$isUser', true] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations.map(conv => ({
        odId: conv._id,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        lastMessageIsUser: conv.lastMessageIsUser,
        totalMessages: conv.totalMessages,
        unreadCount: conv.unreadCount,
      })),
    });
  } catch (error) {
    console.error('GetConversations error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get chat history for a specific user
export async function getChatHistory(req: Request, res: Response): Promise<void> {
  try {
    const { odId } = req.params;
    const userId = decodeURIComponent(odId);
    const { page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      ChatMessage.find({ userId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum),
      ChatMessage.countDocuments({ userId }),
    ]);

    // Mark user messages as read
    await ChatMessage.updateMany(
      { userId, isUser: true, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: {
        messages: messages.map(m => ({
          id: m._id,
          text: m.text,
          isUser: m.isUser,
          isRead: m.isRead,
          createdAt: m.createdAt,
        })),
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetChatHistory error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Send reply from admin to user
export async function sendAdminReply(req: Request, res: Response): Promise<void> {
  try {
    const { odId } = req.params;
    const userId = decodeURIComponent(odId);
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    // Save message to database
    const chatMessage = await ChatMessage.create({
      userId,
      text: message.trim(),
      isUser: false,
      isRead: true, // Admin messages are already "read"
    });

    res.json({
      success: true,
      data: {
        id: chatMessage._id,
        text: chatMessage.text,
        isUser: chatMessage.isUser,
        isRead: chatMessage.isRead,
        createdAt: chatMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('SendAdminReply error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete conversation
export async function deleteConversation(req: Request, res: Response): Promise<void> {
  try {
    const { odId } = req.params;
    const userId = decodeURIComponent(odId);
    
    await ChatMessage.deleteMany({ userId });

    res.json({ success: true });
  } catch (error) {
    console.error('DeleteConversation error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get unread count for all conversations
export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const count = await ChatMessage.countDocuments({ isUser: true, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('GetUnreadCount error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// ==================== PUBLIC ENDPOINTS ====================

export async function handleTelegramAction(req: Request, res: Response): Promise<void> {
  try {
    if (req.method === 'POST') {
      const { action, message, userId } = req.body;

      if (action === 'send' && message && userId) {
        // Save message to database
        const chatMessage = await ChatMessage.create({
          userId,
          text: message,
          isUser: true,
        });

        // Send to Telegram
        const telegramResult = await sendTelegramMessage(
          `👤 <b>Foydalanuvchi:</b> ${userId}\n\n💬 <b>Xabar:</b>\n${message}`
        );

        // Check for quick reply
        const quickReplies = await getSetting<Record<string, string>>('quickReplies', DEFAULT_QUICK_REPLIES);
        const autoResponse = quickReplies[message];

        if (autoResponse) {
          await ChatMessage.create({
            userId,
            text: autoResponse,
            isUser: false,
          });
        }

        res.json({
          success: true,
          messageId: chatMessage._id,
          autoResponse,
        });
        return;
      }
    }

    if (req.method === 'GET') {
      const { action, userId, lastId, messageId } = req.query;

      if (action === 'get' && userId) {
        // Get messages for user
        const query: Record<string, unknown> = { userId };
        if (lastId && lastId !== '0') {
          query._id = { $gt: lastId };
        }

        const messages = await ChatMessage.find(query)
          .sort({ createdAt: 1 })
          .limit(50);

        // Process Telegram updates
        await getTelegramUpdates();

        res.json({
          success: true,
          messages: messages.map((m) => ({
            id: m._id,
            text: m.text,
            isUser: m.isUser,
            isRead: m.isRead,
            timestamp: m.createdAt.toISOString(),
          })),
        });
        return;
      }

      if (action === 'markRead' && userId && messageId) {
        await ChatMessage.findByIdAndUpdate(messageId, { isRead: true });
        res.json({ success: true });
        return;
      }

      if (action === 'getQuickReplies') {
        const quickReplies = await getSetting<Record<string, string>>('quickReplies', DEFAULT_QUICK_REPLIES);
        res.json({ success: true, quickReplies });
        return;
      }

      if (action === 'getOperatorInfo') {
        const operatorInfo = await getSetting('operatorInfo', DEFAULT_OPERATOR_INFO);
        res.json({ success: true, operatorInfo });
        return;
      }
    }

    res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function updateQuickReplies(req: Request, res: Response): Promise<void> {
  try {
    const { quickReplies } = req.body;
    await setSetting('quickReplies', quickReplies);
    res.json({ success: true });
  } catch (error) {
    console.error('UpdateQuickReplies error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function updateOperatorInfo(req: Request, res: Response): Promise<void> {
  try {
    const { operatorInfo } = req.body;
    await setSetting('operatorInfo', operatorInfo);
    res.json({ success: true });
  } catch (error) {
    console.error('UpdateOperatorInfo error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
