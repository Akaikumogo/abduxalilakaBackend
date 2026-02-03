import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getSetting, setSetting } from '../models/index.js';

// Hero settings interface
interface HeroSettings {
  imageUz: string | null;
  imageEn: string | null;
  updatedAt: string;
}

const DEFAULT_HERO_SETTINGS: HeroSettings = {
  imageUz: null,
  imageEn: null,
  updatedAt: new Date().toISOString(),
};

// Get hero settings
export async function getHeroSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSetting<HeroSettings>('heroSettings', DEFAULT_HERO_SETTINGS);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GetHeroSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Upload hero image
export async function uploadHeroImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image uploaded' });
      return;
    }

    const language = req.body.language || 'uz';
    
    if (!['uz', 'en'].includes(language)) {
      res.status(400).json({ success: false, error: 'Invalid language. Use "uz" or "en"' });
      return;
    }

    // Get current settings
    const currentSettings = await getSetting<HeroSettings>('heroSettings', DEFAULT_HERO_SETTINGS);
    
    // Delete old image if exists
    const oldImageKey = language === 'uz' ? 'imageUz' : 'imageEn';
    const oldImage = currentSettings[oldImageKey];
    
    if (oldImage) {
      const oldImagePath = path.join(process.cwd(), 'uploads', 'hero', path.basename(oldImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update settings with new image
    const newImageUrl = `/uploads/hero/${req.file.filename}`;
    const updatedSettings: HeroSettings = {
      ...currentSettings,
      [oldImageKey]: newImageUrl,
      updatedAt: new Date().toISOString(),
    };

    await setSetting('heroSettings', updatedSettings);

    res.json({
      success: true,
      data: {
        imageUrl: newImageUrl,
        language,
        settings: updatedSettings,
      },
    });
  } catch (error) {
    console.error('UploadHeroImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete hero image
export async function deleteHeroImage(req: Request, res: Response): Promise<void> {
  try {
    const { language } = req.params;
    
    if (!['uz', 'en'].includes(language)) {
      res.status(400).json({ success: false, error: 'Invalid language. Use "uz" or "en"' });
      return;
    }

    // Get current settings
    const currentSettings = await getSetting<HeroSettings>('heroSettings', DEFAULT_HERO_SETTINGS);
    
    const imageKey = language === 'uz' ? 'imageUz' : 'imageEn';
    const imageUrl = currentSettings[imageKey];
    
    if (!imageUrl) {
      res.status(404).json({ success: false, error: 'No image found for this language' });
      return;
    }

    // Delete file
    const imagePath = path.join(process.cwd(), 'uploads', 'hero', path.basename(imageUrl));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Update settings
    const updatedSettings: HeroSettings = {
      ...currentSettings,
      [imageKey]: null,
      updatedAt: new Date().toISOString(),
    };

    await setSetting('heroSettings', updatedSettings);

    res.json({
      success: true,
      message: `Hero image for ${language} deleted`,
      data: updatedSettings,
    });
  } catch (error) {
    console.error('DeleteHeroImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get hero image for frontend (public endpoint)
export async function getHeroImage(req: Request, res: Response): Promise<void> {
  try {
    const { language } = req.query;
    const lang = language === 'en' ? 'en' : 'uz';
    
    const settings = await getSetting<HeroSettings>('heroSettings', DEFAULT_HERO_SETTINGS);
    
    // If English requested and exists, return it
    // Otherwise fallback to Uzbek
    let imageUrl = null;
    
    if (lang === 'en' && settings.imageEn) {
      imageUrl = settings.imageEn;
    } else if (settings.imageUz) {
      imageUrl = settings.imageUz;
    }
    
    res.json({
      success: true,
      data: {
        imageUrl,
        language: lang,
        fallback: lang === 'en' && !settings.imageEn && settings.imageUz ? true : false,
      },
    });
  } catch (error) {
    console.error('GetHeroImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
