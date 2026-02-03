import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// Contact settings interface
export interface ContactSettings {
  // Title
  titleUz: string;
  titleEn: string;
  
  // Address
  addressUz: string;
  addressEn: string;
  
  // Landmark
  landmarkUz: string;
  landmarkEn: string;
  
  // Metro
  metroUz: string;
  metroEn: string;
  
  // Contact info
  phone: string;
  email: string;
  
  // Map
  mapUrl: string;           // Yandex/Google Maps embed URL
  mapLink: string;          // Direct link to open map
  
  // Social links
  telegram: string;
  instagram: string;
  youtube: string;
  
  // Working hours
  workingHoursUz: string;
  workingHoursEn: string;
}

// Default contact settings
const DEFAULT_CONTACT: ContactSettings = {
  titleUz: "Bizning manzil",
  titleEn: "Our Address",
  
  addressUz: "Toshkent shahri, Mirzo Ulug'bek tumani, 5th Sayram line 4A, Sayram business center, 7th floor",
  addressEn: "Tashkent city, Mirzo Ulug'bek district, 5th Sayram lane 4A, Sayram business center, 7th floor",
  
  landmarkUz: "Bo'z bozor, British School, Anor Bank",
  landmarkEn: "Bo'z bazaar, British School, Anor Bank",
  
  metroUz: "Buyuk ipak yo'li Metrosidan 5-6 minut",
  metroEn: "5-6 minutes from Buyuk Ipak Yoli Metro",
  
  phone: "+998712000811",
  email: "info@buranconsulting.uz",
  
  mapUrl: "https://yandex.uz/map-widget/v1/?um=constructor%3Abc7fccc6c24c4b6d9e8c6e3e7c8c6e3e7c8c6e3e&amp;source=constructor",
  mapLink: "https://yandex.uz/maps/-/CDaJrW~R",
  
  telegram: "https://t.me/buranconsulting",
  instagram: "https://instagram.com/buranconsulting",
  youtube: "https://youtube.com/@buranconsulting",
  
  workingHoursUz: "Dushanba - Shanba: 9:00 - 18:00",
  workingHoursEn: "Monday - Saturday: 9:00 AM - 6:00 PM",
};

// Get contact settings (public endpoint)
export async function getContactSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSetting<ContactSettings>('contactSettings', DEFAULT_CONTACT);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GetContactSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Update contact settings (admin)
export async function updateContactSettings(req: Request, res: Response): Promise<void> {
  try {
    const {
      titleUz,
      titleEn,
      addressUz,
      addressEn,
      landmarkUz,
      landmarkEn,
      metroUz,
      metroEn,
      phone,
      email,
      mapUrl,
      mapLink,
      telegram,
      instagram,
      youtube,
      workingHoursUz,
      workingHoursEn,
    } = req.body;

    if (!titleUz || !addressUz || !phone) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: titleUz, addressUz, phone' 
      });
      return;
    }

    const settings: ContactSettings = {
      titleUz,
      titleEn: titleEn || titleUz,
      addressUz,
      addressEn: addressEn || addressUz,
      landmarkUz: landmarkUz || '',
      landmarkEn: landmarkEn || landmarkUz || '',
      metroUz: metroUz || '',
      metroEn: metroEn || metroUz || '',
      phone,
      email: email || '',
      mapUrl: mapUrl || '',
      mapLink: mapLink || '',
      telegram: telegram || '',
      instagram: instagram || '',
      youtube: youtube || '',
      workingHoursUz: workingHoursUz || '',
      workingHoursEn: workingHoursEn || workingHoursUz || '',
    };

    await setSetting('contactSettings', settings);

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('UpdateContactSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
