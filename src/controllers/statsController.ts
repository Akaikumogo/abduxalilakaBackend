import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// Stat item interface
export interface StatItem {
  id: string;
  value: number;
  prefix: string;       // e.g., "$", "+", ""
  suffix: string;       // e.g., "GRANT", "STUDENTS", "%"
  descriptionUz: string;
  descriptionEn: string;
  order: number;
}

// Default stats
const DEFAULT_STATS: StatItem[] = [
  {
    id: 'grant',
    value: 10000,
    prefix: '$',
    suffix: 'GRANT',
    descriptionUz: "10000$ gacha grant yutib olish imkoniyati",
    descriptionEn: "Opportunity to win a grant up to $10000",
    order: 1,
  },
  {
    id: 'students',
    value: 300,
    prefix: '+',
    suffix: 'STUDENTS',
    descriptionUz: "Biz orqali chet elda talaba bo'lganlar soni",
    descriptionEn: "Number of students who became students abroad through us",
    order: 2,
  },
  {
    id: 'reliable',
    value: 100,
    prefix: '',
    suffix: '% RELIABLE',
    descriptionUz: "Biz qonuniy faoliyat olib boramiz",
    descriptionEn: "We operate legally",
    order: 3,
  },
  {
    id: 'universities',
    value: 400,
    prefix: '',
    suffix: 'UNIVERSITIES',
    descriptionUz: "Dunyo bo'ylab 400 dan ortiq universitetlar",
    descriptionEn: "Over 400 universities worldwide",
    order: 4,
  },
];

// Get all stats (public endpoint)
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = await getSetting<StatItem[]>('siteStats', DEFAULT_STATS);
    const sortedStats = [...stats].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedStats });
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get all stats for admin
export async function getStatsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const stats = await getSetting<StatItem[]>('siteStats', DEFAULT_STATS);
    const sortedStats = [...stats].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedStats });
  } catch (error) {
    console.error('GetStatsAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update stat
export async function upsertStat(req: Request, res: Response): Promise<void> {
  try {
    const { id, value, prefix, suffix, descriptionUz, descriptionEn, order } = req.body;

    if (!id || value === undefined || !descriptionUz) {
      res.status(400).json({ success: false, error: 'Missing required fields: id, value, descriptionUz' });
      return;
    }

    const stats = await getSetting<StatItem[]>('siteStats', DEFAULT_STATS);
    
    const newStat: StatItem = {
      id,
      value: Number(value),
      prefix: prefix || '',
      suffix: suffix || '',
      descriptionUz,
      descriptionEn: descriptionEn || descriptionUz,
      order: order !== undefined ? Number(order) : stats.length + 1,
    };

    // Check if stat with this id exists
    const existingIndex = stats.findIndex(s => s.id === id);
    
    if (existingIndex >= 0) {
      // Update existing
      stats[existingIndex] = newStat;
    } else {
      // Add new
      stats.push(newStat);
    }

    await setSetting('siteStats', stats);

    res.json({
      success: true,
      data: newStat,
      message: existingIndex >= 0 ? 'Stat updated' : 'Stat created',
    });
  } catch (error) {
    console.error('UpsertStat error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Update all stats at once
export async function updateAllStats(req: Request, res: Response): Promise<void> {
  try {
    const { stats } = req.body;

    if (!Array.isArray(stats)) {
      res.status(400).json({ success: false, error: 'Stats must be an array' });
      return;
    }

    // Validate each stat
    for (const stat of stats) {
      if (!stat.id || stat.value === undefined || !stat.descriptionUz) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid stat: ${stat.id || 'unknown'}. Required: id, value, descriptionUz` 
        });
        return;
      }
    }

    // Normalize stats
    const normalizedStats: StatItem[] = stats.map((stat, index) => ({
      id: stat.id,
      value: Number(stat.value),
      prefix: stat.prefix || '',
      suffix: stat.suffix || '',
      descriptionUz: stat.descriptionUz,
      descriptionEn: stat.descriptionEn || stat.descriptionUz,
      order: stat.order !== undefined ? Number(stat.order) : index + 1,
    }));

    await setSetting('siteStats', normalizedStats);

    res.json({ success: true, data: normalizedStats });
  } catch (error) {
    console.error('UpdateAllStats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete stat
export async function deleteStat(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const stats = await getSetting<StatItem[]>('siteStats', DEFAULT_STATS);
    const filteredStats = stats.filter(s => s.id !== id);

    if (filteredStats.length === stats.length) {
      res.status(404).json({ success: false, error: 'Stat not found' });
      return;
    }

    // Reorder remaining stats
    const reorderedStats = filteredStats.map((stat, index) => ({
      ...stat,
      order: index + 1,
    }));

    await setSetting('siteStats', reorderedStats);

    res.json({ success: true, message: 'Stat deleted' });
  } catch (error) {
    console.error('DeleteStat error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder stats
export async function reorderStats(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const stats = await getSetting<StatItem[]>('siteStats', DEFAULT_STATS);
    
    // Create a map for quick lookup
    const statsMap = new Map(stats.map(s => [s.id, s]));
    
    // Reorder based on provided ids
    const reorderedStats: StatItem[] = [];
    orderedIds.forEach((id, index) => {
      const stat = statsMap.get(id);
      if (stat) {
        reorderedStats.push({ ...stat, order: index + 1 });
        statsMap.delete(id);
      }
    });

    // Add any remaining stats (not in orderedIds) at the end
    let nextOrder = reorderedStats.length + 1;
    statsMap.forEach(stat => {
      reorderedStats.push({ ...stat, order: nextOrder++ });
    });

    await setSetting('siteStats', reorderedStats);

    res.json({ success: true, data: reorderedStats });
  } catch (error) {
    console.error('ReorderStats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
