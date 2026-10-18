import express from 'express';
import PickupRecord from '../models/PickupRecord.js';
import DonationRequest from '../models/DonationRequest.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// GET /api/pickups - Get all pickup records with pagination (Admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const pickups = await PickupRecord.find(filter)
      .populate('listingId')
      .populate('recipientId', 'name organizationDetails phone location')
      .populate('donorId', 'name organizationDetails phone location')
      .populate('requestId')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await PickupRecord.countDocuments(filter);

    res.json({
      success: true,
      data: pickups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pickups/my - Get pickup records for logged in user (donor or recipient)
router.get('/my', authenticate, async (req, res) => {
  try {
    const isDonor = req.user.role === 'donor';
    const query = req.user.role === 'admin'
      ? {}
      : isDonor
      ? { donorId: req.user._id }
      : { recipientId: req.user._id };

    const pickups = await PickupRecord.find(query)
      .populate('listingId')
      .populate('recipientId', 'name organizationDetails phone location')
      .populate('donorId', 'name organizationDetails phone location')
      .populate('requestId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: pickups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pickups/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pickup = await PickupRecord.findById(req.params.id)
      .populate('listingId')
      .populate('recipientId', 'name organizationDetails phone location')
      .populate('donorId', 'name organizationDetails phone location')
      .populate('requestId');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup record not found.' });
    }

    res.json({ success: true, data: pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/pickups/:id/status - Update pickup status (scheduled -> in_transit -> completed)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, verificationCode, notes } = req.body;
    const pickup = await PickupRecord.findById(req.params.id)
      .populate('listingId')
      .populate('recipientId')
      .populate('donorId');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup record not found.' });
    }

    // Role check: Admin or participant
    const isParticipant =
      String(pickup.recipientId._id) === String(req.user._id) ||
      String(pickup.donorId._id) === String(req.user._id) ||
      req.user.role === 'admin';

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Verification code check on completion if provided by donor
    if (status === 'completed') {
      if (verificationCode && verificationCode.trim() !== pickup.verificationCode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please request the 6-digit PIN from the recipient.'
        });
      }
      pickup.actualPickupTime = new Date();
      // Also mark the associated donation request as completed
      await DonationRequest.findByIdAndUpdate(pickup.requestId, { status: 'completed' });
    }

    if (notes) {
      if (req.user.role === 'donor') pickup.donorNotes = notes;
      else pickup.recipientNotes = notes;
    }

    pickup.status = status;
    await pickup.save();

    // Create notifications for the other party
    const targetUserId = String(req.user._id) === String(pickup.donorId._id)
      ? pickup.recipientId._id
      : pickup.donorId._id;

    await Notification.create({
      recipientUserId: targetUserId,
      title: `Pickup ${status.replace('_', ' ').toUpperCase()}`,
      message: `Pickup for "${pickup.listingId?.title}" is now marked as ${status.replace('_', ' ')}.`,
      type: status === 'completed' ? 'pickup_completed' : 'pickup_scheduled',
      link: '/pickups'
    });

    await logAudit({
      req,
      userId: req.user._id,
      userRole: req.user.role,
      action: `PICKUP_${status.toUpperCase()}`,
      entityType: 'PickupRecord',
      entityId: pickup._id,
      details: { status, actualPickupTime: pickup.actualPickupTime }
    });

    res.json({
      success: true,
      message: `Pickup status updated to ${status}.`,
      data: pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pickups/:id/feedback - Submit post-pickup rating and feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, comments = '' } = req.body;
    const pickup = await PickupRecord.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup record not found.' });
    }

    pickup.feedback = {
      rating: Number(rating),
      comments,
      submittedAt: new Date()
    };

    await pickup.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for helping improve the community network!',
      data: pickup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
