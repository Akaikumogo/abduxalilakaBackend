import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Application } from '../models/index.js';
import { sendToGoogleSheets, sendTelegramNotification } from '../services/notifications.js';

export async function createApplication(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, phone, country, formType } = req.body;

    const application = await Application.create({
      name,
      phone,
      country: country || '',
      formType: formType || 'Website Form',
    });

    // Send to Google Sheets (non-blocking)
    sendToGoogleSheets({
      name,
      phone,
      country,
      formType,
      timestamp: new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
    }).catch(console.error);

    // Send Telegram notification (non-blocking)
    sendTelegramNotification(
      `📋 Yangi ariza!\n\n👤 Ism: ${name}\n📞 Telefon: ${phone}\n🌍 Davlat: ${country || 'Belgilanmagan'}\n📝 Forma: ${formType}`
    ).catch(console.error);

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('CreateApplication error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function getApplications(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email');

    res.json({
      success: true,
      data: {
        items: applications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GetApplications error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function getApplication(req: Request, res: Response): Promise<void> {
  try {
    const application = await Application.findById(req.params.id)
      .populate('assignedTo', 'name email');

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('GetApplication error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function updateApplication(req: Request, res: Response): Promise<void> {
  try {
    const { status, notes, assignedTo } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes, assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('UpdateApplication error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function deleteApplication(req: Request, res: Response): Promise<void> {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('DeleteApplication error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const [total, newCount, contactedCount, inProgressCount, completedCount, cancelledCount] =
      await Promise.all([
        Application.countDocuments(),
        Application.countDocuments({ status: 'new' }),
        Application.countDocuments({ status: 'contacted' }),
        Application.countDocuments({ status: 'in_progress' }),
        Application.countDocuments({ status: 'completed' }),
        Application.countDocuments({ status: 'cancelled' }),
      ]);

    // Get recent applications
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phone country status createdAt');

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Application.countDocuments({
      createdAt: { $gte: today },
    });

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          new: newCount,
          contacted: contactedCount,
          in_progress: inProgressCount,
          completed: completedCount,
          cancelled: cancelledCount,
        },
        todayCount,
        recentApplications,
      },
    });
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
