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
