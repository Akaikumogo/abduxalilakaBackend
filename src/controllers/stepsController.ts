import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// Step item interface
export interface StepItem {
  id: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  descriptionEn: string;
  order: number;
}

// Default steps
const DEFAULT_STEPS: StepItem[] = [
  {
    id: 'step-1',
    titleUz: 'Murojaat qilasiz',
    titleEn: 'Contact Us',
    descriptionUz: "Ushbu sayt orqali yoki 712000811 raqamiga qo'ng'iroq qilib konsultatsiya olasiz yoki ofisimizga kelasiz",
    descriptionEn: "Contact us through this website or call 712000811 for consultation or visit our office",
    order: 1,
  },
  {
    id: 'step-2',
    titleUz: 'Shartnoma bilan tanishasiz',
    titleEn: 'Review the Contract',
    descriptionUz: "Biz yuborgan shartnoma shartlari bilan tanishib chiqib imzolaysiz va kerakli hujjatlarni bizga yuborasiz",
    descriptionEn: "Review and sign the contract we send, and submit the required documents to us",
    order: 2,
  },
  {
    id: 'step-3',
    titleUz: "Suhbatdan o'tish",
    titleEn: 'Pass the Interview',
    descriptionUz: "Buran Consulting sizni suhbatdan oldin tushishi mumkin bo'lgan savollar bo'yicha tayyorlaydi va siz suhbatdan o'tasiz",
    descriptionEn: "Buran Consulting prepares you for possible interview questions and you pass the interview",
    order: 3,
  },
  {
    id: 'step-4',
    titleUz: 'VISA olish',
    titleEn: 'Get VISA',
    descriptionUz: "BURAN CONSULTING VISA 100% chiqishi uchun hujjatlarni to'g'ri taqdim qilishda va VISA uchun bo'ladigan suhbatdan yaxshi o'tishizda ko'maklashadi.",
    descriptionEn: "BURAN CONSULTING helps ensure 100% visa approval by properly submitting documents and preparing you for the visa interview",
    order: 4,
  },
  {
    id: 'step-5',
    titleUz: 'Ketishga tayyorgarlik!',
    titleEn: 'Prepare for Departure!',
    descriptionUz: "VISAni olib, yotoqxonadan joy bron qilgandan keyin bemalol ketishga tayyorgarlik ko'rishingiz mumkin!",
    descriptionEn: "After getting your VISA and booking accommodation, you can safely prepare for departure!",
    order: 5,
  },
];

// Get all steps (public endpoint)
export async function getSteps(req: Request, res: Response): Promise<void> {
  try {
    const steps = await getSetting<StepItem[]>('howItWorksSteps', DEFAULT_STEPS);
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedSteps });
  } catch (error) {
    console.error('GetSteps error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get all steps for admin
export async function getStepsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const steps = await getSetting<StepItem[]>('howItWorksSteps', DEFAULT_STEPS);
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedSteps });
  } catch (error) {
    console.error('GetStepsAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update step
export async function upsertStep(req: Request, res: Response): Promise<void> {
  try {
    const { id, titleUz, titleEn, descriptionUz, descriptionEn, order } = req.body;

    if (!id || !titleUz || !descriptionUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, titleUz, descriptionUz' 
      });
      return;
    }

    const steps = await getSetting<StepItem[]>('howItWorksSteps', DEFAULT_STEPS);
    const existingIndex = steps.findIndex(s => s.id === id);
    
    const newStep: StepItem = {
      id,
      titleUz,
      titleEn: titleEn || titleUz,
      descriptionUz,
      descriptionEn: descriptionEn || descriptionUz,
      order: order !== undefined ? Number(order) : steps.length + 1,
    };

    if (existingIndex >= 0) {
      steps[existingIndex] = newStep;
    } else {
      steps.push(newStep);
    }

    await setSetting('howItWorksSteps', steps);

    res.json({
      success: true,
      data: newStep,
      message: existingIndex >= 0 ? 'Step updated' : 'Step created',
    });
  } catch (error) {
    console.error('UpsertStep error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete step
export async function deleteStep(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const steps = await getSetting<StepItem[]>('howItWorksSteps', DEFAULT_STEPS);
    const filteredSteps = steps.filter(s => s.id !== id);

    if (filteredSteps.length === steps.length) {
      res.status(404).json({ success: false, error: 'Step not found' });
      return;
    }

    // Reorder remaining steps
    const reorderedSteps = filteredSteps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));

    await setSetting('howItWorksSteps', reorderedSteps);

    res.json({ success: true, message: 'Step deleted' });
  } catch (error) {
    console.error('DeleteStep error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder steps
export async function reorderSteps(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const steps = await getSetting<StepItem[]>('howItWorksSteps', DEFAULT_STEPS);
    
    const stepsMap = new Map(steps.map(s => [s.id, s]));
    
    const reorderedSteps: StepItem[] = [];
    orderedIds.forEach((id, index) => {
      const step = stepsMap.get(id);
      if (step) {
        reorderedSteps.push({ ...step, order: index + 1 });
        stepsMap.delete(id);
      }
    });

    // Add remaining steps
    let nextOrder = reorderedSteps.length + 1;
    stepsMap.forEach(step => {
      reorderedSteps.push({ ...step, order: nextOrder++ });
    });

    await setSetting('howItWorksSteps', reorderedSteps);

    res.json({ success: true, data: reorderedSteps });
  } catch (error) {
    console.error('ReorderSteps error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
