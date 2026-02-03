import { config } from '../config/index.js';
import { ChatMessage } from '../models/index.js';

const TELEGRAM_API_URL = `https://api.telegram.org/bot${config.telegram.botToken}`;

let lastUpdateId = 0;
const userMessages: Map<number, string> = new Map();

export async function sendTelegramMessage(
  message: string,
  chatId?: string,
  replyToMessageId?: number
): Promise<{ ok: boolean; messageId?: number }> {
  if (!config.telegram.botToken) {
    return { ok: false };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId || config.telegram.chatId,
        text: message,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
      }),
    });

    const result = await response.json() as { ok: boolean; result?: { message_id: number } };
    
    if (result.ok && result.result) {
      return { ok: true, messageId: result.result.message_id };
    }
    
    return { ok: false };
  } catch (error) {
    console.error('Telegram send error:', error);
    return { ok: false };
  }
}

export async function getTelegramUpdates(): Promise<void> {
  if (!config.telegram.botToken) {
    return;
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=0&limit=100`
    );
    
    const result = await response.json() as { 
      ok: boolean; 
      result?: Array<{
        update_id: number;
        message?: {
          message_id: number;
          from?: { id: number };
          chat?: { id: number };
          text?: string;
          reply_to_message?: { message_id: number };
        };
      }>;
    };

    if (!result.ok || !result.result) return;

    for (const update of result.result) {
      lastUpdateId = Math.max(lastUpdateId, update.update_id);

      if (update.message?.text && update.message.from) {
        const chatId = update.message.chat?.id?.toString();
        const fromId = update.message.from.id.toString();

        // Check if this is an admin reply
        if (chatId === config.telegram.chatId && update.message.reply_to_message) {
          const repliedMessageId = update.message.reply_to_message.message_id;
          const userId = userMessages.get(repliedMessageId);

          if (userId) {
            // Save admin response to database
            await ChatMessage.create({
              userId,
              text: update.message.text,
              isUser: false,
              telegramMessageId: update.message.message_id,
            });
          }
        }

        // Store message mapping for replies
        if (update.message.message_id) {
          // This is a simplified mapping - in production you'd want more robust tracking
          const textMatch = update.message.text.match(/Foydalanuvchi:\s*(\S+)/);
          if (textMatch) {
            userMessages.set(update.message.message_id, textMatch[1]);
          }
        }
      }
    }
  } catch (error) {
    console.error('Telegram updates error:', error);
  }
}

// Start polling
let pollingInterval: NodeJS.Timeout | null = null;

export function startTelegramPolling(): void {
  if (pollingInterval) return;
  
  pollingInterval = setInterval(getTelegramUpdates, 2000);
  console.log('✅ Telegram polling started');
}

export function stopTelegramPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⚠️ Telegram polling stopped');
  }
}
