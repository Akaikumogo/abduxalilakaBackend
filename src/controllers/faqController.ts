import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// FAQ item interface
export interface FaqItem {
  id: string;
  questionUz: string;       // Question in Uzbek
  questionEn: string;       // Question in English
  answerUz: string;         // Answer in Uzbek
  answerEn: string;         // Answer in English
  order: number;
}

// FAQ section settings
export interface FaqSettings {
  titleUz: string;
  titleEn: string;
  subtitleUz: string;
  subtitleEn: string;
  phoneNumber: string;
}

// Default FAQ settings
const DEFAULT_FAQ_SETTINGS: FaqSettings = {
  titleUz: "Ko'p beriladigan savollar",
  titleEn: "Frequently Asked Questions",
  subtitleUz: "O'z savolingizga javob topolmadingizmi? Bizga qo'ng'iroq qiling",
  subtitleEn: "Didn't find your answer? Call us",
  phoneNumber: "+998712000811",
};

// Default FAQs
const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    questionUz: "O'qish davrida ishlash mumkinmi?",
    questionEn: "Is it possible to work during studies?",
    answerUz: "Ha, talabalar ko'plab mamlakatlarda o'qish davrida ishlash imkoniyatiga ega. Masalan, Buyuk Britaniyada haftasiga 20 soatgacha, yozgi ta'tillarda esa to'liq vaqt ishlash mumkin. Boshqa mamlakatlarda ham shunga o'xshash imkoniyatlar mavjud.",
    answerEn: "Yes, students have the opportunity to work during studies in many countries. For example, in the UK, you can work 20 hours per week, and full time during summer holidays. Similar opportunities are available in other countries.",
    order: 1,
  },
  {
    id: 'faq-2',
    questionUz: "Ingliz tilini yaxshi bilmasam ham chet elda o'qiy olamanmi?",
    questionEn: "I don't know English well, can I study abroad?",
    answerUz: "Ha, albatta! Ko'plab universitetlar til kurslarini taklif qiladi. Siz avval til kursida o'qib, keyin asosiy dasturga o'tishingiz mumkin. Shuningdek, ba'zi mamlakatlarda mahalliy tilda o'qish imkoniyati ham mavjud.",
    answerEn: "Yes, of course! Many universities offer language courses. You can first study in a language course and then move to the main program. Also, some countries offer the opportunity to study in the local language.",
    order: 2,
  },
  {
    id: 'faq-3',
    questionUz: "Shartnoma summasi qancha?",
    questionEn: "How much is the contract amount?",
    answerUz: "Shartnoma summasi tanlangan mamlakat va universitetga qarab farq qiladi. Batafsil ma'lumot uchun biz bilan bog'laning va bepul konsultatsiya oling.",
    answerEn: "The contract amount varies depending on the selected country and university. Contact us for detailed information and get a free consultation.",
    order: 3,
  },
];

// Get FAQ settings (public endpoint)
export async function getFaqSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSetting<FaqSettings>('faqSettings', DEFAULT_FAQ_SETTINGS);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GetFaqSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Update FAQ settings (admin)
export async function updateFaqSettings(req: Request, res: Response): Promise<void> {
  try {
    const { titleUz, titleEn, subtitleUz, subtitleEn, phoneNumber } = req.body;

    if (!titleUz) {
      res.status(400).json({ success: false, error: 'Missing required field: titleUz' });
      return;
    }

    const settings: FaqSettings = {
      titleUz,
      titleEn: titleEn || titleUz,
      subtitleUz: subtitleUz || '',
      subtitleEn: subtitleEn || subtitleUz || '',
      phoneNumber: phoneNumber || '',
    };

    await setSetting('faqSettings', settings);

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('UpdateFaqSettings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get FAQs (public endpoint)
export async function getFaqs(req: Request, res: Response): Promise<void> {
  try {
    const faqs = await getSetting<FaqItem[]>('faqs', DEFAULT_FAQS);
    const sortedFaqs = [...faqs].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedFaqs });
  } catch (error) {
    console.error('GetFaqs error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get FAQs for admin
export async function getFaqsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const faqs = await getSetting<FaqItem[]>('faqs', DEFAULT_FAQS);
    const sortedFaqs = [...faqs].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedFaqs });
  } catch (error) {
    console.error('GetFaqsAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update FAQ
export async function upsertFaq(req: Request, res: Response): Promise<void> {
  try {
    const { id, questionUz, questionEn, answerUz, answerEn, order } = req.body;

    if (!id || !questionUz || !answerUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, questionUz, answerUz' 
      });
      return;
    }

    const faqs = await getSetting<FaqItem[]>('faqs', DEFAULT_FAQS);
    const existingIndex = faqs.findIndex(f => f.id === id);
    
    const newFaq: FaqItem = {
      id,
      questionUz,
      questionEn: questionEn || questionUz,
      answerUz,
      answerEn: answerEn || answerUz,
      order: order !== undefined ? Number(order) : faqs.length + 1,
    };

    if (existingIndex >= 0) {
      faqs[existingIndex] = newFaq;
    } else {
      faqs.push(newFaq);
    }

    await setSetting('faqs', faqs);

    res.json({
      success: true,
      data: newFaq,
      message: existingIndex >= 0 ? 'FAQ updated' : 'FAQ created',
    });
  } catch (error) {
    console.error('UpsertFaq error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete FAQ
export async function deleteFaq(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const faqs = await getSetting<FaqItem[]>('faqs', DEFAULT_FAQS);
    const filteredFaqs = faqs.filter(f => f.id !== id);
    
    if (filteredFaqs.length === faqs.length) {
      res.status(404).json({ success: false, error: 'FAQ not found' });
      return;
    }

    // Reorder remaining FAQs
    const reorderedFaqs = filteredFaqs.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    await setSetting('faqs', reorderedFaqs);

    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    console.error('DeleteFaq error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder FAQs
export async function reorderFaqs(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const faqs = await getSetting<FaqItem[]>('faqs', DEFAULT_FAQS);
    
    const faqsMap = new Map(faqs.map(f => [f.id, f]));
    
    const reorderedFaqs: FaqItem[] = [];
    orderedIds.forEach((id, index) => {
      const faq = faqsMap.get(id);
      if (faq) {
        reorderedFaqs.push({ ...faq, order: index + 1 });
        faqsMap.delete(id);
      }
    });

    // Add remaining FAQs
    let nextOrder = reorderedFaqs.length + 1;
    faqsMap.forEach(faq => {
      reorderedFaqs.push({ ...faq, order: nextOrder++ });
    });

    await setSetting('faqs', reorderedFaqs);

    res.json({ success: true, data: reorderedFaqs });
  } catch (error) {
    console.error('ReorderFaqs error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
