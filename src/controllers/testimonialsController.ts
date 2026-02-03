import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';
import fs from 'fs';
import path from 'path';

// Testimonial item interface
export interface TestimonialItem {
  id: string;
  avatar: string | null;      // Avatar image URL
  textUz: string;             // Testimonial text in Uzbek
  textEn: string;             // Testimonial text in English
  nameUz: string;             // Person name in Uzbek
  nameEn: string;             // Person name in English
  universityUz: string;       // University name in Uzbek
  universityEn: string;       // University name in English
  order: number;
}

// Default testimonials
const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testimonial-1',
    avatar: '/images/testimonials/student1.webp',
    textUz: "Salom hammaga. Men Muhammadali Sattorov, NJUPT University'da Xitoyda talabaman. Buran Consulting va Dilshod akaga minnatdorchilik bildirmoqchiman. Agar kimdir Xitoyda o'qishni rejalashtirsa, men ularga Buran Consulting'ni tavsiya qilaman!",
    textEn: "Hello everyone. I am Muhammadali Sattorov, a student at NJUPT University in China. I would like to express my gratitude to Buran Consulting and Dilshod aka. If anyone plans to study in China, I definitely recommend them!",
    nameUz: 'Muhammadali Sattorov',
    nameEn: 'Muhammadali Sattorov',
    universityUz: 'NJUPT University, Xitoy',
    universityEn: 'NJUPT University, China',
    order: 1,
  },
  {
    id: 'testimonial-2',
    avatar: '/images/testimonials/student2.webp',
    textUz: "Salom! Mening ismim MUHAMMADALI va men 18 yoshdaman Xorazmdan. Hozirda Canadian University Dubai'da talabaman. Buran Consulting menga qabul jarayonining har bir bosqichida yordam berdi.",
    textEn: "Hello! My name is MUHAMMADALI and I am 18 years old from Khorezm. I am currently a student at Canadian University Dubai. Buran Consulting made everything incredibly smooth. They guided me through every step of the admission process.",
    nameUz: 'Muhammadali Bakhtiyar',
    nameEn: 'Muhammadali Bakhtiyar',
    universityUz: 'Canadian University Dubai',
    universityEn: 'Canadian University Dubai',
    order: 2,
  },
  {
    id: 'testimonial-3',
    avatar: '/images/testimonials/student3.webp',
    textUz: "Assalomu alaykum! Men Alibek Eshboltaev, hozirda Berlin, Germaniyada 1-kurs talabaman. Chet elda o'qish mening eng katta orzularimdan biri edi va Buran Consulting jamoasi menga bu maqsadga erishishimda yordam berdi.",
    textEn: "Assalomu alaykum! I am Alibek Eshboltaev, currently a 1st-year student in Berlin, Germany. Studying abroad has always been one of my biggest dreams, and the Buran Consulting team helped me achieve this goal.",
    nameUz: 'Alibek Eshboltaev',
    nameEn: 'Alibek Eshboltaev',
    universityUz: 'Berlin, Germaniya',
    universityEn: 'Berlin, Germany',
    order: 3,
  },
];

// Ensure testimonials upload directory exists
const TESTIMONIALS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'testimonials');
if (!fs.existsSync(TESTIMONIALS_UPLOAD_DIR)) {
  fs.mkdirSync(TESTIMONIALS_UPLOAD_DIR, { recursive: true });
}

// Get all testimonials (public endpoint)
export async function getTestimonials(req: Request, res: Response): Promise<void> {
  try {
    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    const sortedTestimonials = [...testimonials].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedTestimonials });
  } catch (error) {
    console.error('GetTestimonials error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get all testimonials for admin
export async function getTestimonialsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    const sortedTestimonials = [...testimonials].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedTestimonials });
  } catch (error) {
    console.error('GetTestimonialsAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update testimonial (without avatar)
export async function upsertTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const { id, textUz, textEn, nameUz, nameEn, universityUz, universityEn, order } = req.body;

    if (!id || !textUz || !nameUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, textUz, nameUz' 
      });
      return;
    }

    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    const existingIndex = testimonials.findIndex(t => t.id === id);
    
    const newTestimonial: TestimonialItem = {
      id,
      avatar: existingIndex >= 0 ? testimonials[existingIndex].avatar : null,
      textUz,
      textEn: textEn || textUz,
      nameUz,
      nameEn: nameEn || nameUz,
      universityUz: universityUz || '',
      universityEn: universityEn || universityUz || '',
      order: order !== undefined ? Number(order) : testimonials.length + 1,
    };

    if (existingIndex >= 0) {
      testimonials[existingIndex] = newTestimonial;
    } else {
      testimonials.push(newTestimonial);
    }

    await setSetting('testimonials', testimonials);

    res.json({
      success: true,
      data: newTestimonial,
      message: existingIndex >= 0 ? 'Testimonial updated' : 'Testimonial created',
    });
  } catch (error) {
    console.error('UpsertTestimonial error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Upload testimonial avatar
export async function uploadTestimonialAvatar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    const testimonialIndex = testimonials.findIndex(t => t.id === id);

    if (testimonialIndex < 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ success: false, error: 'Testimonial not found' });
      return;
    }

    const testimonial = testimonials[testimonialIndex];
    const oldAvatar = testimonial.avatar;

    // Delete old avatar if exists
    if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), oldAvatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update testimonial with new avatar URL
    const avatarUrl = `/uploads/testimonials/${req.file.filename}`;
    testimonials[testimonialIndex] = {
      ...testimonial,
      avatar: avatarUrl,
    };

    await setSetting('testimonials', testimonials);

    res.json({
      success: true,
      data: {
        avatarUrl,
        testimonial: testimonials[testimonialIndex],
      },
    });
  } catch (error) {
    console.error('UploadTestimonialAvatar error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete testimonial avatar
export async function deleteTestimonialAvatar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    const testimonialIndex = testimonials.findIndex(t => t.id === id);

    if (testimonialIndex < 0) {
      res.status(404).json({ success: false, error: 'Testimonial not found' });
      return;
    }

    const testimonial = testimonials[testimonialIndex];
    const avatarUrl = testimonial.avatar;

    // Delete file if exists
    if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update testimonial
    testimonials[testimonialIndex] = {
      ...testimonial,
      avatar: null,
    };

    await setSetting('testimonials', testimonials);

    res.json({
      success: true,
      data: testimonials[testimonialIndex],
    });
  } catch (error) {
    console.error('DeleteTestimonialAvatar error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete testimonial
export async function deleteTestimonial(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    const testimonial = testimonials.find(t => t.id === id);
    
    if (!testimonial) {
      res.status(404).json({ success: false, error: 'Testimonial not found' });
      return;
    }

    // Delete avatar if exists
    if (testimonial.avatar && testimonial.avatar.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), testimonial.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const filteredTestimonials = testimonials.filter(t => t.id !== id);
    
    // Reorder remaining testimonials
    const reorderedTestimonials = filteredTestimonials.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    await setSetting('testimonials', reorderedTestimonials);

    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    console.error('DeleteTestimonial error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder testimonials
export async function reorderTestimonials(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const testimonials = await getSetting<TestimonialItem[]>('testimonials', DEFAULT_TESTIMONIALS);
    
    const testimonialsMap = new Map(testimonials.map(t => [t.id, t]));
    
    const reorderedTestimonials: TestimonialItem[] = [];
    orderedIds.forEach((id, index) => {
      const testimonial = testimonialsMap.get(id);
      if (testimonial) {
        reorderedTestimonials.push({ ...testimonial, order: index + 1 });
        testimonialsMap.delete(id);
      }
    });

    // Add remaining testimonials
    let nextOrder = reorderedTestimonials.length + 1;
    testimonialsMap.forEach(testimonial => {
      reorderedTestimonials.push({ ...testimonial, order: nextOrder++ });
    });

    await setSetting('testimonials', reorderedTestimonials);

    res.json({ success: true, data: reorderedTestimonials });
  } catch (error) {
    console.error('ReorderTestimonials error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
