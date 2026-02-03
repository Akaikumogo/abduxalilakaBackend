import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';
import fs from 'fs';
import path from 'path';

// Country item interface
export interface CountryItem {
  id: string;
  imageUz: string | null;      // Image URL for Uzbek (required)
  imageEn: string | null;      // Image URL for English (optional)
  nameUz: string;              // Country name in Uzbek
  nameEn: string;              // Country name in English
  bgText: string;              // Background text (usually English name in caps)
  order: number;
}

// Default countries
const DEFAULT_COUNTRIES: CountryItem[] = [
  { id: 'germany', imageUz: '/images/countries/germany.webp', imageEn: null, nameUz: 'Germaniya', nameEn: 'Germany', bgText: 'GERMANY', order: 1 },
  { id: 'latvia', imageUz: '/images/countries/latvia.webp', imageEn: null, nameUz: 'Latviya', nameEn: 'Latvia', bgText: 'LATVIA', order: 2 },
  { id: 'australia', imageUz: '/images/countries/australia.webp', imageEn: null, nameUz: 'Avstraliya', nameEn: 'Australia', bgText: 'AUSTRALIA', order: 3 },
  { id: 'uk', imageUz: '/images/countries/uk.webp', imageEn: null, nameUz: 'Buyuk Britaniya', nameEn: 'United Kingdom', bgText: 'UNITED KINGDOM', order: 4 },
  { id: 'dubai', imageUz: '/images/countries/dubai.webp', imageEn: null, nameUz: 'Dubay', nameEn: 'Dubai', bgText: 'DUBAI', order: 5 },
  { id: 'china', imageUz: '/images/countries/china.webp', imageEn: null, nameUz: 'Xitoy', nameEn: 'China', bgText: 'CHINA', order: 6 },
  { id: 'korea', imageUz: '/images/countries/korea.webp', imageEn: null, nameUz: 'Koreya', nameEn: 'South Korea', bgText: 'SOUTH KOREA', order: 7 },
  { id: 'singapore', imageUz: '/images/countries/singapore.webp', imageEn: null, nameUz: 'Singapur', nameEn: 'Singapore', bgText: 'SINGAPORE', order: 8 },
  { id: 'malaysia', imageUz: '/images/countries/malaysia.webp', imageEn: null, nameUz: 'Malayziya', nameEn: 'Malaysia', bgText: 'MALAYSIA', order: 9 },
  { id: 'turkey', imageUz: '/images/countries/turkey.webp', imageEn: null, nameUz: 'Turkiya', nameEn: 'Turkey', bgText: 'TURKEY', order: 10 },
  { id: 'cyprus', imageUz: '/images/countries/cyprus.webp', imageEn: null, nameUz: 'Kipr', nameEn: 'Cyprus', bgText: 'CYPRUS', order: 11 },
  { id: 'netherlands', imageUz: '/images/countries/netherlands.webp', imageEn: null, nameUz: 'Niderlandiya', nameEn: 'Netherlands', bgText: 'NETHERLANDS', order: 12 },
];

// Ensure countries upload directory exists
const COUNTRIES_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'countries');
if (!fs.existsSync(COUNTRIES_UPLOAD_DIR)) {
  fs.mkdirSync(COUNTRIES_UPLOAD_DIR, { recursive: true });
}

// Get all countries (public endpoint)
export async function getCountries(req: Request, res: Response): Promise<void> {
  try {
    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    const sortedCountries = [...countries].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedCountries });
  } catch (error) {
    console.error('GetCountries error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get all countries for admin
export async function getCountriesAdmin(req: Request, res: Response): Promise<void> {
  try {
    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    const sortedCountries = [...countries].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedCountries });
  } catch (error) {
    console.error('GetCountriesAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update country (without image)
export async function upsertCountry(req: Request, res: Response): Promise<void> {
  try {
    const { id, nameUz, nameEn, bgText, order } = req.body;

    if (!id || !nameUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, nameUz' 
      });
      return;
    }

    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    const existingIndex = countries.findIndex(c => c.id === id);
    
    const newCountry: CountryItem = {
      id,
      imageUz: existingIndex >= 0 ? countries[existingIndex].imageUz : null,
      imageEn: existingIndex >= 0 ? countries[existingIndex].imageEn : null,
      nameUz,
      nameEn: nameEn || nameUz,
      bgText: bgText || (nameEn || nameUz).toUpperCase(),
      order: order !== undefined ? Number(order) : countries.length + 1,
    };

    if (existingIndex >= 0) {
      countries[existingIndex] = newCountry;
    } else {
      countries.push(newCountry);
    }

    await setSetting('countries', countries);

    res.json({
      success: true,
      data: newCountry,
      message: existingIndex >= 0 ? 'Country updated' : 'Country created',
    });
  } catch (error) {
    console.error('UpsertCountry error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Upload country image
export async function uploadCountryImage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { language = 'uz' } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    const countryIndex = countries.findIndex(c => c.id === id);

    if (countryIndex < 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ success: false, error: 'Country not found' });
      return;
    }

    const country = countries[countryIndex];
    const imageField = language === 'en' ? 'imageEn' : 'imageUz';
    const oldImage = country[imageField];

    // Delete old image if exists
    if (oldImage && oldImage.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), oldImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update country with new image URL
    const imageUrl = `/uploads/countries/${req.file.filename}`;
    countries[countryIndex] = {
      ...country,
      [imageField]: imageUrl,
    };

    await setSetting('countries', countries);

    res.json({
      success: true,
      data: {
        imageUrl,
        country: countries[countryIndex],
      },
    });
  } catch (error) {
    console.error('UploadCountryImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete country image
export async function deleteCountryImage(req: Request, res: Response): Promise<void> {
  try {
    const { id, language } = req.params;

    if (!['uz', 'en'].includes(language)) {
      res.status(400).json({ success: false, error: 'Invalid language' });
      return;
    }

    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    const countryIndex = countries.findIndex(c => c.id === id);

    if (countryIndex < 0) {
      res.status(404).json({ success: false, error: 'Country not found' });
      return;
    }

    const country = countries[countryIndex];
    const imageField = language === 'en' ? 'imageEn' : 'imageUz';
    const imageUrl = country[imageField];

    // Delete file if exists
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update country
    countries[countryIndex] = {
      ...country,
      [imageField]: null,
    };

    await setSetting('countries', countries);

    res.json({
      success: true,
      data: countries[countryIndex],
    });
  } catch (error) {
    console.error('DeleteCountryImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete country
export async function deleteCountry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    const country = countries.find(c => c.id === id);
    
    if (!country) {
      res.status(404).json({ success: false, error: 'Country not found' });
      return;
    }

    // Delete images
    for (const imageUrl of [country.imageUz, country.imageEn]) {
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const filteredCountries = countries.filter(c => c.id !== id);
    
    // Reorder remaining countries
    const reorderedCountries = filteredCountries.map((ctry, index) => ({
      ...ctry,
      order: index + 1,
    }));

    await setSetting('countries', reorderedCountries);

    res.json({ success: true, message: 'Country deleted' });
  } catch (error) {
    console.error('DeleteCountry error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder countries
export async function reorderCountries(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const countries = await getSetting<CountryItem[]>('countries', DEFAULT_COUNTRIES);
    
    const countriesMap = new Map(countries.map(c => [c.id, c]));
    
    const reorderedCountries: CountryItem[] = [];
    orderedIds.forEach((id, index) => {
      const country = countriesMap.get(id);
      if (country) {
        reorderedCountries.push({ ...country, order: index + 1 });
        countriesMap.delete(id);
      }
    });

    // Add remaining countries
    let nextOrder = reorderedCountries.length + 1;
    countriesMap.forEach(country => {
      reorderedCountries.push({ ...country, order: nextOrder++ });
    });

    await setSetting('countries', reorderedCountries);

    res.json({ success: true, data: reorderedCountries });
  } catch (error) {
    console.error('ReorderCountries error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
