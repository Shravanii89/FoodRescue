import express from 'express';
import DonationRequest from '../models/DonationRequest.js';
import FoodListing from '../models/FoodListing.js';
import PickupRecord from '../models/PickupRecord.js';
import Notification from '../models/Notification.js';
import { authenticate, authorize, requireVerified } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// POST /api/requests - Create donation claim request (Atomic Quantity Conditional Update)
router.post('/', authenticate, authorize('recipient', 'admin'), requireVerified, async (req, res) => {
  try {
    const {
      listingId,
      requestedQuantity,
      peopleToFeed,
      pickupDetails = {},
      message = ''
    } = req.body;

    if (!listingId || !requestedQuantity || !peopleToFeed) {
      return res.status(400).json({
        success: false,
        message: 'listingId, requestedQuantity, and peopleToFeed are required.'
      });
    }

    const qty = Number(requestedQuantity);
    const people = Number(peopleToFeed);

    if (qty <= 0 || people <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and number of people must be positive integers.'
      });
    }

    // Advanced MongoDB Conditional Atomic Update:
    // Prevents race conditions and double claims by atomically decrementing remainingQuantity
    // ONLY if remainingQuantity >= requestedQuantity and status is available/partially_claimed.
    const updatedListing = await FoodListing.findOneAndUpdate(
      {
        _id: listingId,
        status: { $in: ['available', 'partially_claimed'] },
        remainingQuantity: { $gte: qty },
        expiryTime: { $gt: new Date() }
      },
      {
        $inc: { remainingQuantity: -qty }
      },
      { new: true }
    );

    if (!updatedListing) {
      return res.status(400).json({
        success: false,
        message: 'Claim request failed: Requested quantity exceeds currently available amount or listing has expired.'
      });
    }

    // Adjust status if exhausted
    if (updatedListing.remainingQuantity === 0) {
      updatedListing.status = 'claimed';
      await updatedListing.save();
    } else if (updatedListing.status === 'available') {
      updatedListing.status = 'partially_claimed';
      await updatedListing.save();
    }

    // Create the donation request record
    const donationRequest = await DonationRequest.create({
      listingId: updatedListing._id,
      recipientId: req.user._id,
      donorId: updatedListing.donorId,
      requestedQuantity: qty,
      unit: updatedListing.unit,
      peopleToFeed: people,
      pickupDetails: {
        proposedTime: pickupDetails.proposedTime ? new Date(pickupDetails.proposedTime) : new Date(Date.now() + 2 * 3600 * 1000),
        vehicleType: pickupDetails.vehicleType || 'van',
        contactPerson: pickupDetails.contactPerson || req.user.name,
        contactPhone: pickupDetails.contactPhone || req.user.phone || ''
      },
      message,
      status: 'pending'
    });

    // Notify the donor
    await Notification.create({
      recipientUserId: updatedListing.donorId,
      title: 'New Food Donation Request',
      message: `${req.user.organizationDetails?.orgName || req.user.name} requested ${qty} ${updatedListing.unit} of "${updatedListing.title}".`,
      type: 'request_received',
      link: '/requests'
    });

    await logAudit({
      req,
      userId: req.user._id,
      userRole: req.user.role,
      action: 'REQUEST_CREATE',
      entityType: 'DonationRequest',
      entityId: donationRequest._id,
      details: {
        listingId: updatedListing._id,
        quantity: qty,
        remainingStockAfter: updatedListing.remainingQuantity
      }
    });

    res.status(201).json({
      success: true,
      message: 'Donation request submitted successfully. Stock reserved pending donor approval.',
      data: donationRequest,
      listing: updatedListing
    });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/requests - Get all donation requests across platform (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const requests = await DonationRequest.find(filter)
      .populate('listingId')
      .populate('donorId', 'name organizationDetails phone location')
      .populate('recipientId', 'name organizationDetails phone location verificationStatus')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await DonationRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
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

// GET /api/requests/my - Get all requests for logged-in recipient
router.get('/my', authenticate, authorize('recipient', 'admin'), async (req, res) => {
  try {
    const requests = await DonationRequest.find({ recipientId: req.user._id })
      .populate('listingId')
      .populate('donorId', 'name organizationDetails phone location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/requests/donor - Get all incoming requests for logged-in donor
router.get('/donor', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const requests = await DonationRequest.find({ donorId: req.user._id })
      .populate('listingId')
      .populate('recipientId', 'name organizationDetails phone location verificationStatus')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/requests/:id/status - Approve or reject a donation request
router.put('/:id/status', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const { status, rejectionReason = '' } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or cancelled.'
      });
    }

    const request = await DonationRequest.findById(req.params.id)
      .populate('listingId')
      .populate('recipientId', 'name organizationDetails phone');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Donation request not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && String(request.donorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request.'
      });
    }

    const prevStatus = request.status;
    request.status = status;
    request.reviewedAt = new Date();
    if (rejectionReason) request.rejectionReason = rejectionReason;
    await request.save();

    let pickupRecord = null;

    // If approved: Automatically schedule a pickup record with an OTP verification code
    if (status === 'approved' && prevStatus !== 'approved') {
      pickupRecord = await PickupRecord.create({
        requestId: request._id,
        listingId: request.listingId._id,
        recipientId: request.recipientId._id,
        donorId: request.donorId,
        quantity: request.requestedQuantity,
        unit: request.unit,
        scheduledPickupTime: request.pickupDetails.proposedTime || new Date(Date.now() + 2 * 3600 * 1000),
        status: 'scheduled'
      });

      // Notify recipient
      await Notification.create({
        recipientUserId: request.recipientId._id,
        title: 'Donation Request Approved! 🎉',
        message: `Your request for ${request.requestedQuantity} ${request.unit} of "${request.listingId?.title}" has been approved! Pickup verification code: ${pickupRecord.verificationCode}`,
        type: 'request_approved',
        link: '/pickups'
      });
    }

    // If rejected or cancelled from pending/approved: Atomically release the reserved quantity back to the listing
    if ((status === 'rejected' || status === 'cancelled') && prevStatus === 'pending') {
      await FoodListing.findByIdAndUpdate(request.listingId._id, {
        $inc: { remainingQuantity: request.requestedQuantity },
        $set: { status: 'available' }
      });

      // Notify recipient
      await Notification.create({
        recipientUserId: request.recipientId._id,
        title: 'Donation Request Update',
        message: `Your request for "${request.listingId?.title}" was ${status}. Reason: ${rejectionReason || 'No reason specified.'}`,
        type: 'request_rejected',
        link: '/requests'
      });
    }

    await logAudit({
      req,
      userId: req.user._id,
      userRole: req.user.role,
      action: `REQUEST_${status.toUpperCase()}`,
      entityType: 'DonationRequest',
      entityId: request._id,
      details: { newStatus: status, rejectionReason }
    });

    res.json({
      success: true,
      message: `Request marked as ${status}.`,
      data: request,
      pickupRecord
    });
  } catch (error) {
    console.error('Request status update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
