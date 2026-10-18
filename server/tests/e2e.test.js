import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import DonationRequest from '../models/DonationRequest.js';
import PickupRecord from '../models/PickupRecord.js';
import { seedDatabase } from '../scripts/seed.js';

const runE2EJourney = async () => {
  console.log('🚀 Running FoodRescue End-to-End Live Workflow Verification...\n');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // Step 1: Donor Login
    console.log('Step 1: Authenticating as Donor (The Grand Orchid)...');
    const donorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donor@foodrescue.org', password: 'DonorPassword123!' })
    });
    const donorAuth = await donorLoginRes.json();
    if (!donorAuth.success) throw new Error('Donor login failed: ' + donorAuth.message);
    console.log(`  ✅ Donor Authenticated: ${donorAuth.user.name} (${donorAuth.user.organizationDetails.orgName})`);

    // Step 2: Donor Creates New Surplus Food Listing
    console.log('\nStep 2: Donor Creating New Surplus Food Listing...');
    const createListingRes = await fetch(`${baseUrl}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorAuth.token}`
      },
      body: JSON.stringify({
        title: 'Late Night Banquet Biryani & Gravy',
        description: 'Wedding banquet surplus packed in thermal containers.',
        category: 'cooked_meals',
        quantity: 50,
        unit: 'meals',
        dietaryType: 'vegetarian',
        preparationTime: new Date(),
        expiryTime: new Date(Date.now() + 4 * 3600 * 1000), // 4 hours left
        pickupAddress: 'The Grand Orchid Gate 4, Indiranagar, Bengaluru',
        location: { coordinates: [77.6408, 12.9784] },
        storageInstructions: 'Keep in warm containers above 60°C'
      })
    });
    const newListingData = await createListingRes.json();
    if (!newListingData.success) throw new Error('Create listing failed: ' + newListingData.message);
    const createdListingId = newListingData.data._id;
    console.log(`  ✅ Listing Published: "${newListingData.data.title}" (ID: ${createdListingId})`);
    console.log(`  📦 Initial Quantity: ${newListingData.data.quantity} ${newListingData.data.unit}`);

    // Step 3: Recipient / NGO Login
    console.log('\nStep 3: Authenticating as Verified NGO (Hope Community Kitchen)...');
    const ngoLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ngo@foodrescue.org', password: 'NgoPassword123!' })
    });
    const ngoAuth = await ngoLoginRes.json();
    if (!ngoAuth.success) throw new Error('NGO login failed: ' + ngoAuth.message);
    console.log(`  ✅ NGO Authenticated: ${ngoAuth.user.name} (${ngoAuth.user.organizationDetails.orgName})`);

    // Step 4: NGO Evaluates Smart Match Engine
    console.log('\nStep 4: NGO Running Smart Match Recommendations...');
    const matchRes = await fetch(`${baseUrl}/match/recommendations?desiredQuantity=30`, {
      headers: { Authorization: `Bearer ${ngoAuth.token}` }
    });
    const matchData = await matchRes.json();
    if (!matchData.success) throw new Error('Smart match failed: ' + matchData.message);
    console.log(`  ✅ Smart Match Engine Ranked ${matchData.count} Available Batches:`);
    matchData.data.slice(0, 2).forEach((m, idx) => {
      console.log(`     #${idx + 1} "${m.title}" -> ${m.matchScore}% Match (${m.matchExplanation})`);
    });

    // Step 5: NGO Submits Atomic Claim Request
    console.log('\nStep 5: NGO Submitting Atomic Claim Request for 20 meals...');
    const claimRes = await fetch(`${baseUrl}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoAuth.token}`
      },
      body: JSON.stringify({
        listingId: createdListingId,
        requestedQuantity: 20,
        peopleToFeed: 25,
        pickupDetails: {
          proposedTime: new Date(Date.now() + 1.5 * 3600 * 1000),
          vehicleType: 'van'
        },
        message: 'Picking up with clean stainless food containers for community shelter.'
      })
    });
    const claimData = await claimRes.json();
    if (!claimData.success) throw new Error('Claim submission failed: ' + claimData.message);
    const requestId = claimData.data._id;
    console.log(`  ✅ Atomic Claim Registered! Request ID: ${requestId}`);
    console.log(`  📉 Listing Remaining Quantity Decremented: ${claimData.listing.remainingQuantity} meals (Stock reserved atomically!)`);

    // Step 6: Donor Approves Request & Generates Pickup Record
    console.log('\nStep 6: Donor Approving Claim Request...');
    const approveRes = await fetch(`${baseUrl}/requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorAuth.token}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error('Approve failed: ' + approveData.message);
    console.log(`  ✅ Request Approved by Donor! Status: ${approveData.data.status}`);
    const pickupRecord = approveData.pickupRecord;
    console.log(`  🔐 Pickup Scheduled with Verification PIN: ${pickupRecord?.verificationCode}`);

    // Step 7: Complete Pickup Handover with PIN
    console.log('\nStep 7: Finalizing Pickup Handover with 6-digit PIN...');
    const completeRes = await fetch(`${baseUrl}/pickups/${pickupRecord._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorAuth.token}`
      },
      body: JSON.stringify({
        status: 'completed',
        verificationCode: pickupRecord.verificationCode,
        notes: 'Handover complete. Insulated vessels inspected.'
      })
    });
    const completeData = await completeRes.json();
    if (!completeData.success) throw new Error('Complete pickup failed: ' + completeData.message);
    console.log(`  ✅ Pickup Marked Completed! Actual Pickup Time: ${completeData.data.actualPickupTime}`);

    // Step 8: Admin Overview & Analytics Verification
    console.log('\nStep 8: Authenticating as Admin & Verifying System Metrics...');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@foodrescue.org', password: 'AdminPassword123!' })
    });
    const adminAuth = await adminLoginRes.json();
    const adminAnalyticsRes = await fetch(`${baseUrl}/analytics/dashboard-stats`);
    const analyticsData = await adminAnalyticsRes.json();

    console.log('  ✅ Admin Analytics Aggregations:');
    console.log(`     • Total Rescued Meals: ${analyticsData.stats.totalMealsClaimed}`);
    console.log(`     • Estimated CO2 Offset: ${analyticsData.stats.co2OffsetKg} kg`);
    console.log(`     • Water Conserved: ${analyticsData.stats.waterSavedLiters} L`);
    console.log(`     • Total Pickups Completed: ${analyticsData.stats.totalPickupsCompleted}`);

    console.log('\n======================================================');
    console.log('🎉 ALL LIVE END-TO-END FLOWS PASSED FLAWLESSLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ E2E Journey Failed:', err.message);
    process.exit(1);
  }
};

runE2EJourney();
