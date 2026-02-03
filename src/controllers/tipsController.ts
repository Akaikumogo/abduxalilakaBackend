import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// Video tip item interface
export interface TipItem {
  id: string;
  youtubeUrl: string;       // YouTube video URL/embed
  titleUz: string;          // Title in Uzbek
  titleEn: string;          // Title in English
  order: number;
}

// Default tips
const DEFAULT_TIPS: TipItem[] = [
  {
    id: 'tip-1',
    youtubeUrl: 'https://www.youtube.com/embed/l9qcWT7Tnxc',
    titleUz: "IELTS siz yevropada o'qish",
    titleEn: "Study in Europe without IELTS",
    order: 1,
  },
  {
    id: 'tip-2',
    youtubeUrl: 'https://www.youtube.com/embed/Oxegp3kvqr4',
    titleUz: "Dubayda o'qish",
    titleEn: "Study in Dubai",
    order: 2,
  },
  {
    id: 'tip-3',
    youtubeUrl: 'https://www.youtube.com/embed/_bmEEebUC84',
    titleUz: "Til bilmasdan",
    titleEn: "Without knowing the language",
    order: 3,
  },
];

// Get tips (public endpoint)
export async function getTips(req: Request, res: Response): Promise<void> {
  try {
    const tips = await getSetting<TipItem[]>('videoTips', DEFAULT_TIPS);
    const sortedTips = [...tips].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedTips });
  } catch (error) {
    console.error('GetTips error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get tips for admin
export async function getTipsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const tips = await getSetting<TipItem[]>('videoTips', DEFAULT_TIPS);
    const sortedTips = [...tips].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedTips });
  } catch (error) {
    console.error('GetTipsAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Helper to convert YouTube URL to embed format
function toEmbedUrl(url: string): string {
  if (url.includes('/embed/')) return url;
  
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// Create or update tip
export async function upsertTip(req: Request, res: Response): Promise<void> {
  try {
    const { id, youtubeUrl, titleUz, titleEn, order } = req.body;

    if (!id || !youtubeUrl || !titleUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, youtubeUrl, titleUz' 
      });
      return;
    }

    const tips = await getSetting<TipItem[]>('videoTips', DEFAULT_TIPS);
    const existingIndex = tips.findIndex(t => t.id === id);
    
    const newTip: TipItem = {
      id,
      youtubeUrl: toEmbedUrl(youtubeUrl),
      titleUz,
      titleEn: titleEn || titleUz,
      order: order !== undefined ? Number(order) : tips.length + 1,
    };

    if (existingIndex >= 0) {
      tips[existingIndex] = newTip;
    } else {
      tips.push(newTip);
    }

    await setSetting('videoTips', tips);

    res.json({
      success: true,
      data: newTip,
      message: existingIndex >= 0 ? 'Tip updated' : 'Tip created',
    });
  } catch (error) {
    console.error('UpsertTip error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete tip
export async function deleteTip(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const tips = await getSetting<TipItem[]>('videoTips', DEFAULT_TIPS);
    const filteredTips = tips.filter(t => t.id !== id);
    
    if (filteredTips.length === tips.length) {
      res.status(404).json({ success: false, error: 'Tip not found' });
      return;
    }

    // Reorder remaining tips
    const reorderedTips = filteredTips.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    await setSetting('videoTips', reorderedTips);

    res.json({ success: true, message: 'Tip deleted' });
  } catch (error) {
    console.error('DeleteTip error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder tips
export async function reorderTips(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const tips = await getSetting<TipItem[]>('videoTips', DEFAULT_TIPS);
    
    const tipsMap = new Map(tips.map(t => [t.id, t]));
    
    const reorderedTips: TipItem[] = [];
    orderedIds.forEach((id, index) => {
      const tip = tipsMap.get(id);
      if (tip) {
        reorderedTips.push({ ...tip, order: index + 1 });
        tipsMap.delete(id);
      }
    });

    // Add remaining tips
    let nextOrder = reorderedTips.length + 1;
    tipsMap.forEach(tip => {
      reorderedTips.push({ ...tip, order: nextOrder++ });
    });

    await setSetting('videoTips', reorderedTips);

    res.json({ success: true, data: reorderedTips });
  } catch (error) {
    console.error('ReorderTips error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
