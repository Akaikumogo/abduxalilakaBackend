import { config } from '../config/index.js';

interface GoogleSheetsData {
  name: string;
  phone: string;
  country?: string;
  formType?: string;
  timestamp: string;
}

export async function sendToGoogleSheets(data: GoogleSheetsData): Promise<boolean> {
  if (!config.googleSheets.url) {
    console.warn('Google Sheets URL not configured');
    return false;
  }

  try {
    await fetch(config.googleSheets.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    console.error('Google Sheets error:', error);
    return false;
  }
}

export async function sendTelegramNotification(message: string): Promise<boolean> {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    console.warn('Telegram not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegram.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json() as { ok: boolean };
    return result.ok;
  } catch (error) {
    console.error('Telegram notification error:', error);
    return false;
  }
}
