import express from 'express';
import FoodListing from '../models/FoodListing.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { rankListingsForRecipient } from '../services/smartMatchService.js';

const router = express.Router();

// GET /api/match/recommendations
// Calculates rule-based compatibility score (0-100) for real database food listings
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const {
      desiredQuantity,
      dietaryType,
      category,
      maxDistanceKm
    } = req.query;

    const recipient = await User.findById(req.user._id);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Find available, non-expired listings
    const filter = {
      status: { $in: ['available', 'partially_claimed'] },
      expiryTime: { $gt: new Date() },
      remainingQuantity: { $gt: 0 }
    };

    if (category) filter.category = category;

    const availableListings = await FoodListing.find(filter)
      .populate('donorId', 'name organizationDetails location phone')
      .lean();

    const criteria = {
      desiredQuantity: desiredQuantity ? Number(desiredQuantity) : undefined,
      dietaryType: dietaryType || undefined
    };

    let rankedListings = rankListingsForRecipient(availableListings, recipient, criteria);

    // Optional max distance filter
    if (maxDistanceKm) {
      const maxDist = Number(maxDistanceKm);
      rankedListings = rankedListings.filter((item) => item.distanceKm <= maxDist);
    }

    res.json({
      success: true,
      engine: 'Intelligent Rule-Based Smart Match Engine v2.1',
      description: 'Scores (0-100) computed deterministically from Haversine distance, stock-to-demand ratio, expiry urgency, and recipient dietary profiles.',
      count: rankedListings.length,
      data: rankedListings
    });
  } catch (error) {
    console.error('Smart match recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
