import express from 'express';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import DonationRequest from '../models/DonationRequest.js';
import PickupRecord from '../models/PickupRecord.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// Apply auth and admin-only role to all admin routes
router.use(authenticate, authorize('admin'));

// GET /api/admin/overview - Detailed platform statistics
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      pendingVerifications,
      totalListings,
      activeListings,
      expiredListings,
      totalRequests,
      totalPickups
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ verificationStatus: 'pending' }),
      FoodListing.countDocuments(),
      FoodListing.countDocuments({ status: 'available', expiryTime: { $gt: now } }),
      FoodListing.countDocuments({ expiryTime: { $lte: now }, status: { $in: ['available', 'partially_claimed'] } }),
      DonationRequest.countDocuments(),
      PickupRecord.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingVerifications,
        totalListings,
        activeListings,
        expiredListings,
        totalRequests,
        totalPickups
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users - List users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const { role, verificationStatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'organizationDetails.orgName': { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
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

// GET /api/admin/pending-ngos - Convenience endpoint for NGOs awaiting verification
router.get('/pending-ngos', async (req, res) => {
  try {
    const pending = await User.find({ verificationStatus: 'pending' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/verify - Verify or reject an NGO/donor
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { verificationStatus } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected', 'pending'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'verificationStatus must be verified, rejected, or pending.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.verificationStatus = verificationStatus;
    if (verificationStatus === 'verified') {
      user.verifiedAt = new Date();
      user.verifiedBy = req.user._id;
    }
    await user.save();

    // Create notification for the user
    await Notification.create({
      recipientUserId: user._id,
      title: `Account Verification: ${verificationStatus.toUpperCase()}`,
      message: verificationStatus === 'verified'
        ? 'Congratulations! Your organization profile has been officially verified by the platform admin. You now have full access to claim food donations.'
        : 'Your organization verification request was reviewed and marked as rejected. Please contact support or update your organization details.',
      type: 'verification_update',
      link: '/profile'
    });

    await logAudit({
      req,
      userId: req.user._id,
      userRole: 'admin',
      action: 'ADMIN_USER_VERIFY',
      entityType: 'User',
      entityId: user._id,
      details: { newVerificationStatus: verificationStatus, targetEmail: user.email }
    });

    res.json({
      success: true,
      message: `User ${user.name} verification status updated to ${verificationStatus}.`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/status - Toggle active status (deactivate/activate user)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    await logAudit({
      req,
      userId: req.user._id,
      userRole: 'admin',
      action: 'ADMIN_USER_STATUS_TOGGLE',
      entityType: 'User',
      entityId: user._id,
      details: { isActive: user.isActive, targetEmail: user.email }
    });

    res.json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/expired-listings - View listings past expiry time and update them
router.get('/expired-listings', async (req, res) => {
  try {
    const now = new Date();
    const expired = await FoodListing.find({
      expiryTime: { $lte: now },
      status: { $in: ['available', 'partially_claimed'] }
    })
      .populate('donorId', 'name organizationDetails phone')
      .sort({ expiryTime: -1 })
      .lean();

    res.json({
      success: true,
      count: expired.length,
      data: expired
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/expired-listings/cleanup - Mark all overdue listings as expired
router.post('/expired-listings/cleanup', async (req, res) => {
  try {
    const now = new Date();
    const result = await FoodListing.updateMany(
      {
        expiryTime: { $lte: now },
        status: { $in: ['available', 'partially_claimed'] }
      },
      {
        $set: { status: 'expired' }
      }
    );

    await logAudit({
      req,
      userId: req.user._id,
      userRole: 'admin',
      action: 'ADMIN_EXPIRED_LISTINGS_CLEANUP',
      entityType: 'System',
      details: { modifiedCount: result.modifiedCount }
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} overdue food listings.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/audit-logs - View audit logs with filtering and pagination
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, entityType, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
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

export default router;
