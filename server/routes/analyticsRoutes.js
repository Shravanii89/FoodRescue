import express from 'express';
import FoodListing from '../models/FoodListing.js';
import DonationRequest from '../models/DonationRequest.js';
import PickupRecord from '../models/PickupRecord.js';
import User from '../models/User.js';
import { getDemandAndExpiryPredictions } from '../services/predictionService.js';

const router = express.Router();

// GET /api/analytics/dashboard-stats
// Aggregates platform KPIs, meals saved, and environmental offsets
router.get('/dashboard-stats', async (req, res) => {
  try {
    const now = new Date();

    // 1. Core Counts
    const [totalDonors, totalRecipients, activeListingsCount, totalPickupsCompleted] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'recipient' }),
      FoodListing.countDocuments({
        status: { $in: ['available', 'partially_claimed'] },
        expiryTime: { $gt: now }
      }),
      PickupRecord.countDocuments({ status: 'completed' })
    ]);

    // 2. Aggregate Total Meals and Kilograms Donated using MongoDB Aggregation
    const mealsSavedAgg = await DonationRequest.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalMealsClaimed: { $sum: '$requestedQuantity' },
          totalPeopleFed: { $sum: '$peopleToFeed' }
        }
      }
    ]);

    const totalMealsClaimed = mealsSavedAgg[0]?.totalMealsClaimed || 0;
    const totalPeopleFed = mealsSavedAgg[0]?.totalPeopleFed || 0;

    // Environmental metrics calculations:
    // Every 1 kg of food rescued offsets approx 2.5 kg CO2 and saves approx 1,000 liters of water
    // Assuming 1 meal ~= 0.4 kg
    const estimatedKgSaved = Math.round(totalMealsClaimed * 0.4);
    const co2OffsetKg = Math.round(estimatedKgSaved * 2.5);
    const waterSavedLiters = Math.round(estimatedKgSaved * 1000);

    // 3. Category Breakdown Aggregation
    const categoryBreakdown = await FoodListing.aggregate([
      {
        $group: {
          _id: '$category',
          totalListings: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalListings: 1,
          totalQuantity: 1,
          _id: 0
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    // 4. Monthly Donation Trends ($group by Year-Month)
    const monthlyTrends = await DonationRequest.aggregate([
      { $match: { status: { $in: ['completed', 'approved'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          donationsCount: { $sum: 1 },
          mealsDistributed: { $sum: '$requestedQuantity' }
        }
      },
      {
        $project: {
          month: '$_id',
          donationsCount: 1,
          mealsDistributed: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);

    // 5. Request Status Distribution
    const requestStatusDistribution = await DonationRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalMealsClaimed,
        totalPeopleFed,
        estimatedKgSaved,
        co2OffsetKg,
        waterSavedLiters,
        activeListingsCount,
        totalPickupsCompleted,
        totalDonors,
        totalRecipients
      },
      categoryBreakdown,
      monthlyTrends,
      requestStatusDistribution
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/predictions - AI / Rule-based Demand & Expiry Risk Analysis
router.get('/predictions', async (req, res) => {
  try {
    const predictions = await getDemandAndExpiryPredictions();
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Prediction analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
