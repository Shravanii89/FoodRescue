import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import DonationRequest from '../models/DonationRequest.js';
import { calculateDistanceKm, scoreListingForRecipient } from '../services/smartMatchService.js';
import { seedDatabase } from '../scripts/seed.js';

const runTests = async () => {
  console.log('🧪 Starting FoodRescue Backend & Database Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  };

  try {
    // 1. Database Connection & Seed Test
    console.log('Step 1: Connecting to MongoDB and verifying seed initialization...');
    await connectDB();
    await seedDatabase();

    const userCount = await User.countDocuments();
    assert(userCount >= 5, `Database seeded successfully with ${userCount} users`);

    const listingCount = await FoodListing.countDocuments();
    assert(listingCount >= 6, `Surplus food listings seeded (${listingCount} listings found)`);

    // 2. Authentication Model Test
    console.log('\nStep 2: Testing User Authentication & Password Hashing...');
    const donor = await User.findOne({ email: 'donor@foodrescue.org' }).select('+password');
    assert(donor !== null, 'Found donor user in MongoDB');

    const isMatch = await donor.comparePassword('DonorPassword123!');
    assert(isMatch === true, 'Bcrypt password comparison works properly');

    const isWrongMatch = await donor.comparePassword('WrongPassword!');
    assert(isWrongMatch === false, 'Bcrypt rejects incorrect passwords');

    // 3. Advanced Geospatial & Smart Match Test
    console.log('\nStep 3: Testing Geospatial Calculations & Smart Match Engine...');
    const indiranagarCoords = [77.6408, 12.9784];
    const shivajinagarCoords = [77.6033, 12.9857];
    const distance = calculateDistanceKm(indiranagarCoords, shivajinagarCoords);
    assert(distance > 3 && distance < 6, `Haversine distance accurately computed (${distance} km)`);

    const ngoUser = await User.findOne({ email: 'ngo@foodrescue.org' });
    const availableListing = await FoodListing.findOne({
      status: { $in: ['available', 'partially_claimed'] },
      expiryTime: { $gt: new Date() }
    });

    const matchResult = scoreListingForRecipient(availableListing, ngoUser, { desiredQuantity: 30 });
    assert(matchResult.score >= 50 && matchResult.score <= 100, `Smart Match computed transparent score (${matchResult.score}/100)`);
    assert(typeof matchResult.explanation === 'string' && matchResult.explanation.length > 10, 'Smart Match provides human-readable breakdown');

    // 4. Atomic Conditional Update Test
    console.log('\nStep 4: Testing MongoDB Atomic Conditional Updates for Stock Claiming...');
    const initialListing = await FoodListing.findById(availableListing._id);
    const initialRemaining = initialListing.remainingQuantity;

    // Simulate claiming 5 units atomically
    const claimQty = 5;
    const updatedListing = await FoodListing.findOneAndUpdate(
      {
        _id: initialListing._id,
        status: { $in: ['available', 'partially_claimed'] },
        remainingQuantity: { $gte: claimQty }
      },
      {
        $inc: { remainingQuantity: -claimQty }
      },
      { new: true }
    );

    assert(updatedListing !== null, 'Atomic conditional update succeeded');
    assert(updatedListing.remainingQuantity === initialRemaining - claimQty, `Remaining quantity decremented atomically (${initialRemaining} -> ${updatedListing.remainingQuantity})`);

    // Attempting to claim more than available should fail atomically
    const excessiveQty = 999999;
    const overclaimAttempt = await FoodListing.findOneAndUpdate(
      {
        _id: initialListing._id,
        status: { $in: ['available', 'partially_claimed'] },
        remainingQuantity: { $gte: excessiveQty }
      },
      {
        $inc: { remainingQuantity: -excessiveQty }
      },
      { new: true }
    );

    assert(overclaimAttempt === null, 'Atomic update safely rejected claim exceeding available quantity');

    // 5. Admin Verification Workflow Test
    console.log('\nStep 5: Testing Admin Verification Workflow...');
    const pendingNgo = await User.findOne({ email: 'newngo@shelter.org' });
    assert(pendingNgo.verificationStatus === 'pending', 'Pending NGO detected in database');

    pendingNgo.verificationStatus = 'verified';
    pendingNgo.verifiedAt = new Date();
    await pendingNgo.save();

    const verifiedNgo = await User.findById(pendingNgo._id);
    assert(verifiedNgo.verificationStatus === 'verified', 'Admin successfully verified NGO status');

    console.log('\n======================================================');
    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Test suite error:', err);
    process.exit(1);
  }
};

runTests();
