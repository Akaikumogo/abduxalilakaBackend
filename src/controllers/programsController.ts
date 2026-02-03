import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';
import fs from 'fs';
import path from 'path';

// Program item interface
export interface ProgramItem {
  id: string;
  imageUz: string | null;      // Image URL for Uzbek (required)
  imageEn: string | null;      // Image URL for English (optional)
  titleUz: string;
  titleEn: string;
  description1Uz: string;      // Main description
  description1En: string;
  description2Uz: string;      // Highlighted/special text
  description2En: string;
  order: number;
}

// Default programs
const DEFAULT_PROGRAMS: ProgramItem[] = [
  {
    id: 'language-prep',
    imageUz: '/images/programs/language-prep.jpg',
    imageEn: null,
    titleUz: 'Til tayyorlov kurslari',
    titleEn: 'Language Preparation Courses',
    description1Uz: "Ko'pgina yoshlar chet elda o'qish orzusini ingliz tilini bilmasligi sababli amalga oshira olmaydi. Aslida, bu muammo emas. Chet el universitetlarida til tayyorlov kurslari orqali o'qishni boshlash mumkin.",
    description1En: "Many young people think their dream of studying abroad is closed because they don't know English. In reality, this is not the case. It is possible to start studying there directly through language preparation courses at foreign universities.",
    description2Uz: "🎵 Qaysi davlatlarda? Shartlari qanday? Qancha pul kerak?",
    description2En: "🎵 Which countries? What are the conditions? How much money is needed?",
    order: 1,
  },
  {
    id: 'foundation',
    imageUz: '/images/programs/foundation.jpg',
    imageEn: null,
    titleUz: 'Foundation dasturi',
    titleEn: 'Foundation Programme',
    description1Uz: "Dunyo bo'ylab ko'plab universitetlar bakalavr darajasiga kirish uchun 12 yillik ta'limni talab qiladi. Foundation dasturi bakalavriatga tayyorlov bosqichi bo'lib, talabaning akademik bilimlarini va ingliz tilini universitet darajasiga olib chiqadi.",
    description1En: "Many universities around the world require 12 years of education to enter the bachelor's level. The Foundation program is a preparatory stage for bachelor's degree, bringing the student's academic knowledge and English to university level.",
    description2Uz: "⚠️ Eng katta xato - Foundation kerak yoki kerak emasligini har bir talaba uchun individual vaziyatni tahlil qilmasdan javob berish.",
    description2En: "⚠️ The biggest mistake is answering the question of whether Foundation is needed or not without analyzing the situation. The right path is individual for each student.",
    order: 2,
  },
  {
    id: 'bachelor',
    imageUz: '/images/programs/bachelor.jpg',
    imageEn: null,
    titleUz: 'Bakalavr darajasi',
    titleEn: "Bachelor's Degree",
    description1Uz: "Chet el universitetlarida bakalavr ta'limi odatda 3-4 yil davom etadi. Qabul talablari mamlakat va universitetga qarab farq qiladi, qabullar yiliga ikki marta - kuz va bahor semestrlarida o'tkaziladi.",
    description1En: "Bachelor's education at foreign universities usually lasts 3-4 years. Admission requirements vary depending on the field and university, and admissions are mainly conducted twice a year — in fall and winter semesters.",
    description2Uz: "📍 Qaysi davlat, qaysi yo'nalish va qaysi byudjet sizga mos keladi?",
    description2En: "📍 Which country, which field, and which budget suits you?",
    order: 3,
  },
];

// Ensure programs upload directory exists
const PROGRAMS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'programs');
if (!fs.existsSync(PROGRAMS_UPLOAD_DIR)) {
  fs.mkdirSync(PROGRAMS_UPLOAD_DIR, { recursive: true });
}

// Get all programs (public endpoint)
export async function getPrograms(req: Request, res: Response): Promise<void> {
  try {
    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const sortedPrograms = [...programs].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedPrograms });
  } catch (error) {
    console.error('GetPrograms error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get program image based on language (with fallback)
export async function getProgramImage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { language = 'uz' } = req.query;

    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const program = programs.find(p => p.id === id);

    if (!program) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }

    // Determine which image to use (with fallback)
    let imageUrl = language === 'en' && program.imageEn ? program.imageEn : program.imageUz;
    const fallback = language === 'en' && !program.imageEn && program.imageUz;

    res.json({
      success: true,
      data: {
        imageUrl,
        language: fallback ? 'uz' : language,
        fallback: !!fallback,
      },
    });
  } catch (error) {
    console.error('GetProgramImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get all programs for admin
export async function getProgramsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const sortedPrograms = [...programs].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedPrograms });
  } catch (error) {
    console.error('GetProgramsAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update program (without image)
export async function upsertProgram(req: Request, res: Response): Promise<void> {
  try {
    const { 
      id, titleUz, titleEn, description1Uz, description1En, 
      description2Uz, description2En, order 
    } = req.body;

    if (!id || !titleUz || !description1Uz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, titleUz, description1Uz' 
      });
      return;
    }

    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const existingIndex = programs.findIndex(p => p.id === id);
    
    const newProgram: ProgramItem = {
      id,
      imageUz: existingIndex >= 0 ? programs[existingIndex].imageUz : null,
      imageEn: existingIndex >= 0 ? programs[existingIndex].imageEn : null,
      titleUz,
      titleEn: titleEn || titleUz,
      description1Uz,
      description1En: description1En || description1Uz,
      description2Uz: description2Uz || '',
      description2En: description2En || description2Uz || '',
      order: order !== undefined ? Number(order) : programs.length + 1,
    };

    if (existingIndex >= 0) {
      programs[existingIndex] = newProgram;
    } else {
      programs.push(newProgram);
    }

    await setSetting('programs', programs);

    res.json({
      success: true,
      data: newProgram,
      message: existingIndex >= 0 ? 'Program updated' : 'Program created',
    });
  } catch (error) {
    console.error('UpsertProgram error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Upload program image
export async function uploadProgramImage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { language = 'uz' } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const programIndex = programs.findIndex(p => p.id === id);

    if (programIndex < 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }

    const program = programs[programIndex];
    const imageField = language === 'en' ? 'imageEn' : 'imageUz';
    const oldImage = program[imageField];

    // Delete old image if exists
    if (oldImage && oldImage.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), oldImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update program with new image URL
    const imageUrl = `/uploads/programs/${req.file.filename}`;
    programs[programIndex] = {
      ...program,
      [imageField]: imageUrl,
    };

    await setSetting('programs', programs);

    res.json({
      success: true,
      data: {
        imageUrl,
        program: programs[programIndex],
      },
    });
  } catch (error) {
    console.error('UploadProgramImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete program image
export async function deleteProgramImage(req: Request, res: Response): Promise<void> {
  try {
    const { id, language } = req.params;

    if (!['uz', 'en'].includes(language)) {
      res.status(400).json({ success: false, error: 'Invalid language' });
      return;
    }

    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const programIndex = programs.findIndex(p => p.id === id);

    if (programIndex < 0) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }

    const program = programs[programIndex];
    const imageField = language === 'en' ? 'imageEn' : 'imageUz';
    const imageUrl = program[imageField];

    // Delete file if exists
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update program
    programs[programIndex] = {
      ...program,
      [imageField]: null,
    };

    await setSetting('programs', programs);

    res.json({
      success: true,
      data: programs[programIndex],
    });
  } catch (error) {
    console.error('DeleteProgramImage error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete program
export async function deleteProgram(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    const program = programs.find(p => p.id === id);
    
    if (!program) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }

    // Delete images
    for (const imageUrl of [program.imageUz, program.imageEn]) {
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const filteredPrograms = programs.filter(p => p.id !== id);
    
    // Reorder remaining programs
    const reorderedPrograms = filteredPrograms.map((prog, index) => ({
      ...prog,
      order: index + 1,
    }));

    await setSetting('programs', reorderedPrograms);

    res.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    console.error('DeleteProgram error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder programs
export async function reorderPrograms(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const programs = await getSetting<ProgramItem[]>('programs', DEFAULT_PROGRAMS);
    
    const programsMap = new Map(programs.map(p => [p.id, p]));
    
    const reorderedPrograms: ProgramItem[] = [];
    orderedIds.forEach((id, index) => {
      const program = programsMap.get(id);
      if (program) {
        reorderedPrograms.push({ ...program, order: index + 1 });
        programsMap.delete(id);
      }
    });

    // Add remaining programs
    let nextOrder = reorderedPrograms.length + 1;
    programsMap.forEach(program => {
      reorderedPrograms.push({ ...program, order: nextOrder++ });
    });

    await setSetting('programs', reorderedPrograms);

    res.json({ success: true, data: reorderedPrograms });
  } catch (error) {
    console.error('ReorderPrograms error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
