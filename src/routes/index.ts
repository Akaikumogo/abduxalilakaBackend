import { Router } from 'express';
import authRoutes from './auth.js';
import applicationRoutes from './applications.js';
import chatRoutes from './chat.js';
import heroRoutes from './hero.js';
import statsRoutes from './stats.js';
import featuresRoutes from './features.js';
import programsRoutes from './programs.js';
import countriesRoutes from './countries.js';
import stepsRoutes from './steps.js';
import videoRoutes from './video.js';
import testimonialsRoutes from './testimonials.js';
import tipsRoutes from './tips.js';
import faqRoutes from './faq.js';
import contactRoutes from './contact.js';
import aboutRoutes from './about.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/telegram', chatRoutes);
router.use('/hero', heroRoutes);
router.use('/stats', statsRoutes);
router.use('/features', featuresRoutes);
router.use('/programs', programsRoutes);
router.use('/countries', countriesRoutes);
router.use('/steps', stepsRoutes);
router.use('/video', videoRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/tips', tipsRoutes);
router.use('/faq', faqRoutes);
router.use('/contact', contactRoutes);
router.use('/about', aboutRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
