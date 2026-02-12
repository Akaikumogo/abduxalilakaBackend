import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getSetting, setSetting } from '../models/index.js';
 
export interface AboutSettings {
  titleUz: string;
  titleEn: string;
  text1Uz: string;
  text1En: string;
  text2Uz: string;
  text2En: string;
  buttonTextUz: string;
  buttonTextEn: string;
}

export interface AboutImageItem {
  id: string;
  imageUrl: string;
  order: number;
}
 
const DEFAULT_ABOUT: AboutSettings = {
  titleUz: 'Biz haqimizda',
  titleEn: 'About us',
  text1Uz:
    "Buran Consulting 2018 yil tashkil topgan va ingliz zabon yurtdagi universitetlar bilan hamkorlikda ishlaydi. Shu vaqtgacha biz 500 ga yaqin insonlarga universitetga kirishda, universitetdan chegirma olishda va viza jarayonlarida ko'maklashgan.",
  text1En:
    'Buran Consulting was founded in 2018 and works in cooperation with universities in English-speaking countries. So far, we have helped nearly 500 people with university admission, tuition discounts, and visa processes.',
  text2Uz:
    "2023 yil Buran Consulting Oxford International Group tomonidan eng zo'r o'rta Osiyodagi agentlik deb topilgan. Bundan tashqari, Buran Consulting British council tomonidan tasdiqlangan agentlik hisoblanadi va ICEF jamg'armasi azosi hisoblanadi.",
  text2En:
    'In 2023, Buran Consulting was recognized by Oxford International Group as the best agency in Central Asia. In addition, Buran Consulting is an agency approved by the British Council and a member of ICEF.',
  buttonTextUz: 'Batafsil',
  buttonTextEn: 'Learn more',
};

const DEFAULT_ABOUT_IMAGES: AboutImageItem[] = [];
 
// Public endpoint
export async function getAboutSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSetting<AboutSettings>('aboutSettings', DEFAULT_ABOUT);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GetAboutSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
 
// Admin endpoint
export async function updateAboutSettings(req: Request, res: Response): Promise<void> {
  try {
    const {
      titleUz,
      titleEn,
      text1Uz,
      text1En,
      text2Uz,
      text2En,
      buttonTextUz,
      buttonTextEn,
    } = req.body || {};
 
    if (!titleUz || !text1Uz) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: titleUz, text1Uz',
      });
      return;
    }
 
    const settings: AboutSettings = {
      titleUz,
      titleEn: titleEn || titleUz,
      text1Uz,
      text1En: text1En || text1Uz,
      text2Uz: text2Uz || '',
      text2En: text2En || text2Uz || '',
      buttonTextUz: buttonTextUz || DEFAULT_ABOUT.buttonTextUz,
      buttonTextEn: buttonTextEn || DEFAULT_ABOUT.buttonTextEn,
    };
 
    await setSetting('aboutSettings', settings);
 
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('UpdateAboutSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Public: get about slider images
export async function getAboutImages(req: Request, res: Response): Promise<void> {
  try {
    const images = await getSetting<AboutImageItem[]>('aboutImages', DEFAULT_ABOUT_IMAGES);
    const sorted = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('GetAboutImages error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Admin: get about slider images
export async function getAboutImagesAdmin(req: Request, res: Response): Promise<void> {
  try {
    const images = await getSetting<AboutImageItem[]>('aboutImages', DEFAULT_ABOUT_IMAGES);
    const sorted = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('GetAboutImagesAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Admin: upload new about slider image
export async function uploadAboutImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const images = await getSetting<AboutImageItem[]>('aboutImages', DEFAULT_ABOUT_IMAGES);

    const newItem: AboutImageItem = {
      id: `aboutimg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      imageUrl,
      order: images.length + 1,
    };

    images.push(newItem);
    await setSetting('aboutImages', images);

    res.json({ success: true, data: newItem });
  } catch (error) {
    console.error('UploadAboutImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Admin: delete about slider image
export async function deleteAboutImage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const images = await getSetting<AboutImageItem[]>('aboutImages', DEFAULT_ABOUT_IMAGES);
    const existing = images.find((img) => img.id === id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    // Delete physical file if it is inside /uploads
    if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
      const relativePath = existing.imageUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const filtered = images.filter((img) => img.id !== id);
    const reordered = filtered.map((img, index) => ({
      ...img,
      order: index + 1,
    }));

    await setSetting('aboutImages', reordered);

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('DeleteAboutImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

