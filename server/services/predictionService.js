import FoodListing from '../models/FoodListing.js';
import DonationRequest from '../models/DonationRequest.js';

/**
 * Historical Demand & Expiry Risk Prediction Service
 */
export const getDemandAndExpiryPredictions = async () => {
  const now = new Date();

  // 1. Category-level demand aggregation from historical requests
  const categoryDemandAggregation = await DonationRequest.aggregate([
    {
      $lookup: {
        from: 'foodlistings',
        localField: 'listingId',
        foreignField: '_id',
        as: 'listing'
      }
    },
    { $unwind: '$listing' },
    {
      $group: {
        _id: '$listing.category',
        totalRequests: { $sum: 1 },
        totalQuantityRequested: { $sum: '$requestedQuantity' },
        avgPeopleFed: { $avg: '$peopleToFeed' },
        approvedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        completedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalRequests: -1 } }
  ]);

  const hasHistoricalData = categoryDemandAggregation.length > 0;

  // Fallback defaults if database has limited history
  const defaultDemandMap = {
    cooked_meals: { demandLevel: 'High', index: 88, avgMealsRequested: 45 },
    packaged_goods: { demandLevel: 'Moderate', index: 65, avgMealsRequested: 30 },
    bakery: { demandLevel: 'High', index: 82, avgMealsRequested: 35 },
    fruits_vegetables: { demandLevel: 'Moderate', index: 70, avgMealsRequested: 50 },
    dairy_products: { demandLevel: 'High', index: 85, avgMealsRequested: 25 },
    raw_ingredients: { demandLevel: 'Moderate', index: 60, avgMealsRequested: 40 },
    beverages: { demandLevel: 'Normal', index: 50, avgMealsRequested: 20 },
    other: { demandLevel: 'Normal', index: 45, avgMealsRequested: 25 }
  };

  const formattedDemand = hasHistoricalData
    ? categoryDemandAggregation.map((cat) => {
        const claimRatio = cat.totalRequests > 0 ? (cat.approvedRequests + cat.completedRequests) / cat.totalRequests : 0.5;
        let demandLevel = 'Normal';
        let demandScore = Math.min(100, Math.round(cat.totalRequests * 15 + claimRatio * 40));

        if (demandScore >= 75) demandLevel = 'High';
        else if (demandScore >= 55) demandLevel = 'Moderate';

        return {
          category: cat._id,
          totalRequests: cat.totalRequests,
          totalQuantityRequested: cat.totalQuantityRequested,
          avgPeopleFed: Math.round(cat.avgPeopleFed || 20),
          demandLevel,
          demandScore
        };
      })
    : Object.entries(defaultDemandMap).map(([cat, val]) => ({
        category: cat,
        totalRequests: 5,
        totalQuantityRequested: val.avgMealsRequested * 5,
        avgPeopleFed: val.avgMealsRequested,
        demandLevel: val.demandLevel,
        demandScore: val.index,
        isFallback: true
      }));

  // 2. High-Risk Near-Expiry Analysis on active listings
  const activeListings = await FoodListing.find({
    status: { $in: ['available', 'partially_claimed'] },
    expiryTime: { $gt: now }
  })
    .populate('donorId', 'name organizationDetails')
    .sort({ expiryTime: 1 })
    .limit(10)
    .lean();

  const nearExpiryRiskList = activeListings.map((listing) => {
    const hoursLeft = (new Date(listing.expiryTime).getTime() - now.getTime()) / (1000 * 60 * 60);
    let riskLevel = 'Low Risk';
    let riskScore = 20;
    let recommendedAction = 'Standard distribution';

    if (hoursLeft <= 3) {
      riskLevel = 'Critical Risk';
      riskScore = 95;
      recommendedAction = 'Dispatch urgent pickup to nearest shelter immediately';
    } else if (hoursLeft <= 6) {
      riskLevel = 'Elevated Risk';
      riskScore = 75;
      recommendedAction = 'Prioritize in Smart Match notifications to local community kitchens';
    } else if (hoursLeft <= 12) {
      riskLevel = 'Moderate Risk';
      riskScore = 50;
      recommendedAction = 'Highlight in explorer for scheduled afternoon collection';
    }

    return {
      _id: listing._id,
      title: listing.title,
      category: listing.category,
      remainingQuantity: listing.remainingQuantity,
      unit: listing.unit,
      donorName: listing.donorId?.organizationDetails?.orgName || listing.donorId?.name || 'Local Donor',
      expiryTime: listing.expiryTime,
      hoursRemaining: Math.round(hoursLeft * 10) / 10,
      riskLevel,
      riskScore,
      recommendedAction
    };
  });

  return {
    hasHistoricalData,
    notice: hasHistoricalData
      ? 'Calculated dynamically from MongoDB historical donation records.'
      : 'Statistical baseline heuristic: limited historical records currently stored.',
    categoryDemand: formattedDemand,
    nearExpiryRiskList
  };
};
