import express from 'express';
import FoodListing from '../models/FoodListing.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// GET /api/listings - Browse available listings with advanced filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      dietaryType,
      status,
      minQuantity,
      maxDistanceKm,
      lat,
      lng,
      page = 1,
      limit = 12,
      sortBy = 'expiryTime',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};

    // By default for recipients/explorers, show only active/available food
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['available', 'partially_claimed'] };
    }

    // Exclude expired listings by default when looking for available food
    if (!status || status === 'available' || status === 'partially_claimed') {
      filter.expiryTime = { $gt: new Date() };
      filter.remainingQuantity = { $gt: 0 };
    }

    if (category) {
      filter.category = category;
    }

    if (dietaryType) {
      filter.dietaryType = dietaryType;
    }

    if (minQuantity) {
      filter.remainingQuantity = { ...filter.remainingQuantity, $gte: Number(minQuantity) };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle Geospatial Filtering with MongoDB 2dsphere index
    if (lat && lng && maxDistanceKm) {
      const maxMeters = Number(maxDistanceKm) * 1000;
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: maxMeters
        }
      };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with populated donor info
    const listings = await FoodListing.find(filter)
      .populate('donorId', 'name organizationDetails location phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await FoodListing.countDocuments(filter);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while querying food listings.'
    });
  }
});

// GET /api/listings/my - For logged-in donor to view their own listings
router.get('/my', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const listings = await FoodListing.find({ donorId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/listings/:id - Detailed view for a single food listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.id || req.params.id)
      .populate('donorId', 'name email phone organizationDetails location verificationStatus');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found.'
      });
    }

    // Increment view count asynchronously
    FoodListing.findByIdAndUpdate(listing._id, { $inc: { viewsCount: 1 } }).exec();

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/listings - Create surplus food listing (Donor only)
router.post('/', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description = '',
      category,
      quantity,
      unit = 'meals',
      dietaryType = 'vegetarian',
      preparationTime = new Date(),
      expiryTime,
      pickupAddress,
      location = {},
      storageInstructions = '',
      isRefrigerationRequired = false
    } = req.body;

    if (!title || !category || !quantity || !expiryTime || !pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, quantity, expiry time, and pickup address are mandatory.'
      });
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number.'
      });
    }

    // Determine GeoJSON coordinates
    let coords = [77.5946, 12.9716];
    if (location.coordinates && location.coordinates.length === 2) {
      coords = [Number(location.coordinates[0]), Number(location.coordinates[1])];
    } else if (req.user.location?.coordinates && req.user.location.coordinates.length === 2) {
      coords = req.user.location.coordinates;
    }

    const newListing = await FoodListing.create({
      title,
      description,
      category,
      quantity: numQty,
      remainingQuantity: numQty,
      unit,
      dietaryType,
      preparationTime: new Date(preparationTime),
      expiryTime: new Date(expiryTime),
      pickupAddress,
      location: {
        type: 'Point',
        coordinates: coords
      },
      storageInstructions: storageInstructions || 'Keep covered in a clean area.',
      isRefrigerationRequired,
      donorId: req.user._id,
      status: 'available'
    });

    await logAudit({
      req,
      userId: req.user._id,
      userRole: req.user.role,
      action: 'LISTING_CREATE',
      entityType: 'FoodListing',
      entityId: newListing._id,
      details: { title, quantity: numQty, category }
    });

    res.status(201).json({
      success: true,
      message: 'Surplus food listing published successfully.',
      data: newListing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/listings/:id - Update food listing
router.put('/:id', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && String(listing.donorId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this listing.'
      });
    }

    const {
      title,
      description,
      category,
      quantity,
      remainingQuantity,
      unit,
      dietaryType,
      expiryTime,
      pickupAddress,
      storageInstructions,
      isRefrigerationRequired,
      status
    } = req.body;

    if (title) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (category) listing.category = category;
    if (unit) listing.unit = unit;
    if (dietaryType) listing.dietaryType = dietaryType;
    if (expiryTime) listing.expiryTime = new Date(expiryTime);
    if (pickupAddress) listing.pickupAddress = pickupAddress;
    if (storageInstructions !== undefined) listing.storageInstructions = storageInstructions;
    if (isRefrigerationRequired !== undefined) listing.isRefrigerationRequired = isRefrigerationRequired;
    if (status) listing.status = status;

    if (quantity !== undefined) {
      const newQty = Number(quantity);
      const diff = newQty - listing.quantity;
      listing.quantity = newQty;
      listing.remainingQuantity = Math.max(0, listing.remainingQuantity + diff);
    }

    if (remainingQuantity !== undefined) {
      listing.remainingQuantity = Math.max(0, Number(remainingQuantity));
      if (listing.remainingQuantity === 0) {
        listing.status = 'claimed';
      }
    }

    await listing.save();

    await logAudit({
      req,
      userId: req.user._id,
      userRole: req.user.role,
      action: 'LISTING_UPDATE',
      entityType: 'FoodListing',
      entityId: listing._id,
      details: { updatedFields: Object.keys(req.body) }
    });

    res.json({
      success: true,
      message: 'Listing updated successfully.',
      data: listing
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/listings/:id - Delete / cancel listing
router.delete('/:id', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (req.user.role !== 'admin' && String(listing.donorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this listing.' });
    }

    listing.status = 'cancelled';
    await listing.save();

    await logAudit({
      req,
      userId: req.user._id,
      userRole: req.user.role,
      action: 'LISTING_CANCEL',
      entityType: 'FoodListing',
      entityId: listing._id
    });

    res.json({
      success: true,
      message: 'Listing cancelled successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
