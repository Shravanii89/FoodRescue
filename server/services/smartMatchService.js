/**
 * Smart Match Engine
 * Intelligent rule-based recommendation algorithm for surplus food redistribution.
 * Transparently calculates compatibility score (0-100) based on real geospatial,
 * temporal, quantity, dietary, and capacity metrics.
 */

// Haversine formula to compute distance in kilometers between two [lng, lat] coordinate pairs
export const calculateDistanceKm = (coords1, coords2) => {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
    return 5.0; // fallback standard 5km
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Score a single food listing against a recipient NGO's criteria
 */
export const scoreListingForRecipient = (listing, recipient, criteria = {}) => {
  const now = new Date();
  const expiryDate = new Date(listing.expiryTime);
  const msRemaining = expiryDate.getTime() - now.getTime();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  // If already expired, return 0 compatibility
  if (hoursRemaining <= 0 || listing.status !== 'available' && listing.status !== 'partially_claimed') {
    return {
      score: 0,
      breakdown: { distance: 0, quantity: 0, urgency: 0, dietary: 0, capacity: 0 },
      explanation: 'Listing is expired or no longer available for donation.'
    };
  }

  const donorCoords = listing.location?.coordinates || [77.5946, 12.9716];
  const recipientCoords = recipient.location?.coordinates || [77.5946, 12.9716];
  const distanceKm = calculateDistanceKm(donorCoords, recipientCoords);

  // 1. Distance Score (Max 30 points)
  let distanceScore = 0;
  if (distanceKm <= 2) distanceScore = 30;
  else if (distanceKm <= 5) distanceScore = 26;
  else if (distanceKm <= 10) distanceScore = 20;
  else if (distanceKm <= 15) distanceScore = 14;
  else if (distanceKm <= 25) distanceScore = 8;
  else distanceScore = 4;

  // 2. Quantity & Demand Fit Score (Max 25 points)
  const targetQuantity = criteria.desiredQuantity || recipient.organizationDetails?.capacityDailyMeals || 40;
  const availableQty = listing.remainingQuantity;
  let quantityScore = 0;
  if (availableQty >= targetQuantity) {
    // Listing has ample supply
    const ratio = targetQuantity / availableQty;
    quantityScore = ratio >= 0.4 ? 25 : 21;
  } else {
    // Partial fulfillment
    const fulfillmentRatio = availableQty / targetQuantity;
    quantityScore = Math.round(fulfillmentRatio * 20);
  }

  // 3. Expiry Urgency Score (Max 25 points)
  // Optimal rescue window for hot meals is 2 - 8 hours
  let urgencyScore = 0;
  let urgencyNote = '';
  if (hoursRemaining > 0 && hoursRemaining < 2) {
    urgencyScore = 18; // Very urgent, pickup needed immediately
    urgencyNote = 'Immediate pickup required (under 2 hours left)';
  } else if (hoursRemaining >= 2 && hoursRemaining <= 8) {
    urgencyScore = 25; // Perfect rescue timing
    urgencyNote = 'Optimal rescue window before expiry';
  } else if (hoursRemaining > 8 && hoursRemaining <= 24) {
    urgencyScore = 22; // Comfortable window
    urgencyNote = 'Good time buffer for collection';
  } else {
    urgencyScore = 18; // >24 hours, stable
    urgencyNote = 'Long shelf life / stable preservation';
  }

  // 4. Dietary & Category Preference Score (Max 15 points)
  let dietaryScore = 12; // base compatibility
  const prefDiet = criteria.dietaryType;
  if (prefDiet) {
    if (listing.dietaryType === prefDiet) {
      dietaryScore = 15;
    } else if (prefDiet === 'vegetarian' && (listing.dietaryType === 'vegan' || listing.dietaryType === 'jain')) {
      dietaryScore = 15;
    } else if (prefDiet === 'vegetarian' && listing.dietaryType === 'non-vegetarian') {
      dietaryScore = 0; // Incompatible with strictly vegetarian recipient
    }
  } else {
    dietaryScore = 14;
  }

  // 5. Recipient Capacity & Verification Score (Max 5 points)
  let capacityScore = 3;
  if (recipient.verificationStatus === 'verified') capacityScore += 1;
  if ((recipient.organizationDetails?.capacityDailyMeals || 0) >= availableQty) capacityScore += 1;

  // Compute final composite score
  const totalScore = Math.min(100, Math.max(10, distanceScore + quantityScore + urgencyScore + dietaryScore + capacityScore));

  // Build transparent human-readable explanation
  const hoursLeftFormatted = hoursRemaining < 1
    ? `${Math.round(hoursRemaining * 60)} mins`
    : `${hoursRemaining.toFixed(1)} hrs`;

  const explanationParts = [];
  if (distanceKm <= 5) {
    explanationParts.push(`nearby location (${distanceKm} km away)`);
  } else {
    explanationParts.push(`reachable distance (${distanceKm} km)`);
  }

  if (availableQty >= targetQuantity) {
    explanationParts.push(`sufficient quantity (${availableQty} ${listing.unit} available)`);
  } else {
    explanationParts.push(`partial fulfillment (${availableQty} ${listing.unit})`);
  }

  explanationParts.push(`${hoursLeftFormatted} remaining before expiry`);

  const explanation = `${totalScore}% match — ${explanationParts.join(', ')}. ${urgencyNote}.`;

  return {
    score: totalScore,
    distanceKm,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    breakdown: {
      distanceScore,
      quantityScore,
      urgencyScore,
      dietaryScore,
      capacityScore
    },
    explanation
  };
};

/**
 * Rank multiple listings for a recipient user
 */
export const rankListingsForRecipient = (listings, recipient, criteria = {}) => {
  const scored = listings.map((listing) => {
    const listingObj = listing.toObject ? listing.toObject() : listing;
    const matchAnalysis = scoreListingForRecipient(listingObj, recipient, criteria);
    return {
      ...listingObj,
      matchScore: matchAnalysis.score,
      distanceKm: matchAnalysis.distanceKm,
      hoursRemaining: matchAnalysis.hoursRemaining,
      matchBreakdown: matchAnalysis.breakdown,
      matchExplanation: matchAnalysis.explanation
    };
  });

  // Filter out zero-score/expired items and sort by matchScore descending
  return scored
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};
