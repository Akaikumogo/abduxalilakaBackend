import { Request, Response } from 'express';
import { getSetting, setSetting } from '../models/index.js';

// Feature item interface
export interface FeatureItem {
  id: string;
  icon: string;           // Emoji or icon identifier
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  descriptionEn: string;
  order: number;
}

// Default features (Why Us section)
const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: 'experience',
    icon: '🎓',
    titleUz: 'Tajriba',
    titleEn: 'Experience',
    descriptionUz: "Uzoq yillik tajriba va ko'plab muvaffaqiyatli keyslar",
    descriptionEn: "Years of experience and many successful cases",
    order: 1,
  },
  {
    id: 'professionalism',
    icon: '👔',
    titleUz: 'Professionallik',
    titleEn: 'Professionalism',
    descriptionUz: "Kuchli va o'z ishini ustalari bo'lgan konsultatlar hamda mutaxassislar",
    descriptionEn: "Strong consultants and specialists who are masters of their craft",
    order: 2,
  },
  {
    id: 'friendliness',
    icon: '🤝',
    titleUz: "Do'stonalik",
    titleEn: 'Friendliness',
    descriptionUz: "Talabalik safarlarida ham qo'llab quvvatlov va ko'maklashuv",
    descriptionEn: "Support and assistance throughout your student journey",
    order: 3,
  },
  {
    id: 'comprehensive',
    icon: '🔄',
    titleUz: 'Kompleks xizmat',
    titleEn: 'Comprehensive Service',
    descriptionUz: "O'qish tanlashdan tortib, viza, hujjatlarni topshirish jarayonlarigacha to'liq yondoshuv",
    descriptionEn: "Full approach from choosing studies to visa and document submission processes",
    order: 4,
  },
  {
    id: 'trust',
    icon: '✅',
    titleUz: 'Ishonch',
    titleEn: 'Trust',
    descriptionUz: "Jarayon shaffofligi va kafolatlangan natija",
    descriptionEn: "Process transparency and guaranteed results",
    order: 5,
  },
  {
    id: 'partnerships',
    icon: '🤝',
    titleUz: 'Hamkorliklar',
    titleEn: 'Partnerships',
    descriptionUz: "Ko'plab o'quv yurtlari bilan shartnomalar, kelishuvlar va manfaatli takliflar",
    descriptionEn: "Contracts, agreements and beneficial offers with many educational institutions",
    order: 6,
  },
];

// Get all features (public endpoint)
export async function getFeatures(req: Request, res: Response): Promise<void> {
  try {
    const features = await getSetting<FeatureItem[]>('whyUsFeatures', DEFAULT_FEATURES);
    const sortedFeatures = [...features].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedFeatures });
  } catch (error) {
    console.error('GetFeatures error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Get all features for admin
export async function getFeaturesAdmin(req: Request, res: Response): Promise<void> {
  try {
    const features = await getSetting<FeatureItem[]>('whyUsFeatures', DEFAULT_FEATURES);
    const sortedFeatures = [...features].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sortedFeatures });
  } catch (error) {
    console.error('GetFeaturesAdmin error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Create or update feature
export async function upsertFeature(req: Request, res: Response): Promise<void> {
  try {
    const { id, icon, titleUz, titleEn, descriptionUz, descriptionEn, order } = req.body;

    if (!id || !icon || !titleUz || !descriptionUz) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: id, icon, titleUz, descriptionUz' 
      });
      return;
    }

    const features = await getSetting<FeatureItem[]>('whyUsFeatures', DEFAULT_FEATURES);
    
    const newFeature: FeatureItem = {
      id,
      icon,
      titleUz,
      titleEn: titleEn || titleUz,
      descriptionUz,
      descriptionEn: descriptionEn || descriptionUz,
      order: order !== undefined ? Number(order) : features.length + 1,
    };

    // Check if feature with this id exists
    const existingIndex = features.findIndex(f => f.id === id);
    
    if (existingIndex >= 0) {
      // Update existing
      features[existingIndex] = newFeature;
    } else {
      // Add new
      features.push(newFeature);
    }

    await setSetting('whyUsFeatures', features);

    res.json({
      success: true,
      data: newFeature,
      message: existingIndex >= 0 ? 'Feature updated' : 'Feature created',
    });
  } catch (error) {
    console.error('UpsertFeature error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Update all features at once
export async function updateAllFeatures(req: Request, res: Response): Promise<void> {
  try {
    const { features } = req.body;

    if (!Array.isArray(features)) {
      res.status(400).json({ success: false, error: 'Features must be an array' });
      return;
    }

    // Validate each feature
    for (const feature of features) {
      if (!feature.id || !feature.icon || !feature.titleUz || !feature.descriptionUz) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid feature: ${feature.id || 'unknown'}. Required: id, icon, titleUz, descriptionUz` 
        });
        return;
      }
    }

    // Normalize features
    const normalizedFeatures: FeatureItem[] = features.map((feature, index) => ({
      id: feature.id,
      icon: feature.icon,
      titleUz: feature.titleUz,
      titleEn: feature.titleEn || feature.titleUz,
      descriptionUz: feature.descriptionUz,
      descriptionEn: feature.descriptionEn || feature.descriptionUz,
      order: feature.order !== undefined ? Number(feature.order) : index + 1,
    }));

    await setSetting('whyUsFeatures', normalizedFeatures);

    res.json({ success: true, data: normalizedFeatures });
  } catch (error) {
    console.error('UpdateAllFeatures error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Delete feature
export async function deleteFeature(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const features = await getSetting<FeatureItem[]>('whyUsFeatures', DEFAULT_FEATURES);
    const filteredFeatures = features.filter(f => f.id !== id);

    if (filteredFeatures.length === features.length) {
      res.status(404).json({ success: false, error: 'Feature not found' });
      return;
    }

    // Reorder remaining features
    const reorderedFeatures = filteredFeatures.map((feature, index) => ({
      ...feature,
      order: index + 1,
    }));

    await setSetting('whyUsFeatures', reorderedFeatures);

    res.json({ success: true, message: 'Feature deleted' });
  } catch (error) {
    console.error('DeleteFeature error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// Reorder features
export async function reorderFeatures(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds must be an array' });
      return;
    }

    const features = await getSetting<FeatureItem[]>('whyUsFeatures', DEFAULT_FEATURES);
    
    // Create a map for quick lookup
    const featuresMap = new Map(features.map(f => [f.id, f]));
    
    // Reorder based on provided ids
    const reorderedFeatures: FeatureItem[] = [];
    orderedIds.forEach((id, index) => {
      const feature = featuresMap.get(id);
      if (feature) {
        reorderedFeatures.push({ ...feature, order: index + 1 });
        featuresMap.delete(id);
      }
    });

    // Add any remaining features (not in orderedIds) at the end
    let nextOrder = reorderedFeatures.length + 1;
    featuresMap.forEach(feature => {
      reorderedFeatures.push({ ...feature, order: nextOrder++ });
    });

    await setSetting('whyUsFeatures', reorderedFeatures);

    res.json({ success: true, data: reorderedFeatures });
  } catch (error) {
    console.error('ReorderFeatures error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
