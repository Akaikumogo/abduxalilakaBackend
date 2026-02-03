import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// Video settings interface
export interface VideoSettings {
  youtubeUrl: string;
  titleUz: string;
  titleEn: string;
  subtitleUz: string;
  subtitleEn: string;
}

// Default video settings
const DEFAULT_VIDEO: VideoSettings = {
  youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  titleUz: "Qisqa video ko'ring",
  titleEn: 'Watch a short video',
  subtitleUz: "Bizning muvaffaqiyat hikoyalarimiz haqida bilib oling",
  subtitleEn: 'Learn about our success stories',
};

// Get video settings (public endpoint)
export async function getVideoSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSetting<VideoSettings>('videoSettings', DEFAULT_VIDEO);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GetVideoSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Update video settings (admin)
export async function updateVideoSettings(req: Request, res: Response): Promise<void> {
  try {
    const { youtubeUrl, titleUz, titleEn, subtitleUz, subtitleEn } = req.body;

    if (!youtubeUrl || !titleUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: youtubeUrl, titleUz' 
      });
      return;
    }

    // Convert YouTube URL to embed format if needed
    let embedUrl = youtubeUrl;
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (youtubeUrl.includes('youtu.be/')) {
      const videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    const settings: VideoSettings = {
      youtubeUrl: embedUrl,
      titleUz,
      titleEn: titleEn || titleUz,
      subtitleUz: subtitleUz || '',
      subtitleEn: subtitleEn || subtitleUz || '',
    };

    await setSetting('videoSettings', settings);

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('UpdateVideoSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
