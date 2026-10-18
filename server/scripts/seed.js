import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import DonationRequest from '../models/DonationRequest.js';
import PickupRecord from '../models/PickupRecord.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { connectDB } from '../config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting FoodRescue database seeding...');

    // Clean existing seed collections to allow idempotent reruns
    await Promise.all([
      User.deleteMany({}),
      FoodListing.deleteMany({}),
      DonationRequest.deleteMany({}),
      PickupRecord.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('🧹 Cleaned existing database records for fresh demonstration.');

    // 1. Create Demonstration Users
    console.log('👤 Creating demonstration users...');

    // Admin
    const adminUser = await User.create({
      name: 'Aditi Rao',
      email: 'admin@foodrescue.org',
      password: 'AdminPassword123!',
      role: 'admin',
      phone: '+91 98450 11223',
      organizationDetails: {
        orgName: 'FoodRescue Headquarters',
        orgType: 'other',
        registrationNumber: 'KA-GOV-2024-ADM',
        capacityDailyMeals: 1000,
        description: 'Central Administrative Operations and Verification Authority'
      },
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'MG Road, Central Bengaluru, Karnataka',
        city: 'Bengaluru'
      },
      verificationStatus: 'verified',
      verifiedAt: new Date()
    });

    // Donors
    const donorHotel = await User.create({
      name: 'Chef Rajesh Sharma',
      email: 'donor@foodrescue.org',
      password: 'DonorPassword123!',
      role: 'donor',
      phone: '+91 98860 45678',
      organizationDetails: {
        orgName: 'The Grand Orchid Banquet & Suites',
        orgType: 'hotel',
        registrationNumber: 'HOTEL-BLR-8921',
        capacityDailyMeals: 200,
        description: 'Luxury hotel and convention center committed to zero buffet waste'
      },
      location: {
        type: 'Point',
        coordinates: [77.6408, 12.9784], // Indiranagar
        address: '100 Feet Road, Indiranagar, Bengaluru',
        city: 'Bengaluru'
      },
      verificationStatus: 'verified',
      verifiedAt: new Date()
    });

    const donorBakery = await User.create({
      name: 'Priya Narang',
      email: 'bakery@foodrescue.org',
      password: 'DonorPassword123!',
      role: 'donor',
      phone: '+91 97421 98765',
      organizationDetails: {
        orgName: 'Crust & Crumb Artisan Bakery',
        orgType: 'bakery',
        registrationNumber: 'FSSAI-2023-771',
        capacityDailyMeals: 80,
        description: 'Bakehouse donating fresh evening artisanal breads and pastries'
      },
      location: {
        type: 'Point',
        coordinates: [77.6229, 12.9352], // Koramangala
        address: '5th Block, Koramangala, Bengaluru',
        city: 'Bengaluru'
      },
      verificationStatus: 'verified',
      verifiedAt: new Date()
    });

    const donorCanteen = await User.create({
      name: 'Mohan Varma',
      email: 'canteen@foodrescue.org',
      password: 'DonorPassword123!',
      role: 'donor',
      phone: '+91 98455 33445',
      organizationDetails: {
        orgName: 'Apex TechPark Campus Dining',
        orgType: 'canteen',
        registrationNumber: 'CP-ITPB-440',
        capacityDailyMeals: 500,
        description: 'Large corporate food court with surplus daily lunch and dinner buffets'
      },
      location: {
        type: 'Point',
        coordinates: [77.7499, 12.9698], // Whitefield
        address: 'ITPL Main Road, Whitefield, Bengaluru',
        city: 'Bengaluru'
      },
      verificationStatus: 'verified',
      verifiedAt: new Date()
    });

    // Recipients / NGOs
    const ngoHope = await User.create({
      name: 'Sister Mary Joseph',
      email: 'ngo@foodrescue.org',
      password: 'NgoPassword123!',
      role: 'recipient',
      phone: '+91 99001 22334',
      organizationDetails: {
        orgName: 'Hope Community Kitchen & Shelter',
        orgType: 'shelter',
        registrationNumber: 'NGO-KAR-4512-BLR',
        capacityDailyMeals: 150,
        description: 'Serving hot meals to urban homeless, migrants, and destitute families daily'
      },
      location: {
        type: 'Point',
        coordinates: [77.6033, 12.9857], // Shivaji Nagar (close to Indiranagar)
        address: 'Shivaji Nagar Community Center, Bengaluru',
        city: 'Bengaluru'
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    const ngoAnnapoorna = await User.create({
      name: 'Suresh Kulkarni',
      email: 'anna@seva.org',
      password: 'NgoPassword123!',
      role: 'recipient',
      phone: '+91 98450 67890',
      organizationDetails: {
        orgName: 'Annapoorna Child Relief Foundation',
        orgType: 'ngo',
        registrationNumber: 'NGO-GOV-9821-DEL',
        capacityDailyMeals: 200,
        description: 'Dedicated to distributing nutritious meals to slum schools and child centers'
      },
      location: {
        type: 'Point',
        coordinates: [77.5833, 12.9250], // Jayanagar
        address: '4th Block, Jayanagar, Bengaluru',
        city: 'Bengaluru'
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: adminUser._id
    });

    // Unverified NGO (Pending Admin Review)
    const ngoPending = await User.create({
      name: 'Arun Kumar',
      email: 'newngo@shelter.org',
      password: 'NgoPassword123!',
      role: 'recipient',
      phone: '+91 98800 77889',
      organizationDetails: {
        orgName: 'Sunrise Urban Night Shelter',
        orgType: 'shelter',
        registrationNumber: 'PENDING-REG-2026',
        capacityDailyMeals: 60,
        description: 'Newly founded winter and night shelter seeking verified food partners'
      },
      location: {
        type: 'Point',
        coordinates: [77.5670, 13.0031], // Malleshwaram
        address: '15th Cross, Malleshwaram, Bengaluru',
        city: 'Bengaluru'
      },
      verificationStatus: 'pending' // Perfect for admin verification testing!
    });

    // 2. Create Realistic Surplus Food Listings
    console.log('🍲 Creating surplus food listings...');
    const now = new Date();

    const listing1 = await FoodListing.create({
      title: 'Fresh Paneer Butter Masala & Steamed Jeera Rice',
      description: 'Surplus buffet preparation from luncheon banquet. Prepared with high hygiene standards in copper containers. Ready for immediate pickup.',
      category: 'cooked_meals',
      quantity: 60,
      remainingQuantity: 35, // 25 claimed by Hope Shelter
      unit: 'meals',
      dietaryType: 'vegetarian',
      preparationTime: new Date(now.getTime() - 2 * 3600 * 1000),
      expiryTime: new Date(now.getTime() + 4.5 * 3600 * 1000), // ~4.5 hours left (optimal rescue)
      pickupAddress: 'The Grand Orchid Kitchen Bay, 100 Ft Rd, Indiranagar',
      location: {
        type: 'Point',
        coordinates: [77.6408, 12.9784]
      },
      storageInstructions: 'Keep insulated boxes closed. Serve within 4 hours.',
      isRefrigerationRequired: false,
      donorId: donorHotel._id,
      status: 'partially_claimed',
      viewsCount: 42
    });

    const listing2 = await FoodListing.create({
      title: 'Artisan Multi-grain & Brioche Bread Loaves',
      description: 'Day-end freshly baked surplus loaves and butter brioche buns. Packaged in food-grade kraft bags.',
      category: 'bakery',
      quantity: 45,
      remainingQuantity: 45,
      unit: 'portions',
      dietaryType: 'vegetarian',
      preparationTime: new Date(now.getTime() - 4 * 3600 * 1000),
      expiryTime: new Date(now.getTime() + 18 * 3600 * 1000), // 18 hours left
      pickupAddress: 'Crust & Crumb Bakery, 5th Block, Koramangala',
      location: {
        type: 'Point',
        coordinates: [77.6229, 12.9352]
      },
      storageInstructions: 'Store in dry room temperature.',
      isRefrigerationRequired: false,
      donorId: donorBakery._id,
      status: 'available',
      viewsCount: 19
    });

    const listing3 = await FoodListing.create({
      title: 'Nutritious Dal Khichdi & Mixed Vegetable Poriyal',
      description: 'Wholesome corporate dining lunch surplus. Packed in heavy-duty food warming vessels.',
      category: 'cooked_meals',
      quantity: 90,
      remainingQuantity: 90,
      unit: 'meals',
      dietaryType: 'vegetarian',
      preparationTime: new Date(now.getTime() - 1.5 * 3600 * 1000),
      expiryTime: new Date(now.getTime() + 5 * 3600 * 1000), // 5 hours left
      pickupAddress: 'Apex Dining Hall C, ITPB TechPark, Whitefield',
      location: {
        type: 'Point',
        coordinates: [77.7499, 12.9698]
      },
      storageInstructions: 'Maintain in hot vessels above 60°C.',
      isRefrigerationRequired: false,
      donorId: donorCanteen._id,
      status: 'available',
      viewsCount: 31
    });

    const listing4 = await FoodListing.create({
      title: 'Farm Fresh Tomatoes, Bell Peppers & Cucumbers',
      description: 'Surplus raw salad vegetables delivered this morning. Surplus to banquet requirements.',
      category: 'fruits_vegetables',
      quantity: 35,
      remainingQuantity: 35,
      unit: 'kg',
      dietaryType: 'vegan',
      preparationTime: new Date(now.getTime() - 6 * 3600 * 1000),
      expiryTime: new Date(now.getTime() + 48 * 3600 * 1000), // 2 days left
      pickupAddress: 'The Grand Orchid Storage Bay 2, Indiranagar',
      location: {
        type: 'Point',
        coordinates: [77.6408, 12.9784]
      },
      storageInstructions: 'Store in cool ventilated vegetable crates.',
      isRefrigerationRequired: false,
      donorId: donorHotel._id,
      status: 'available',
      viewsCount: 15
    });

    const listing5 = await FoodListing.create({
      title: 'Packaged Organic Toned Milk & Unsweetened Curd',
      description: 'Factory sealed dairy surplus crates with unbroken cold-chain seals.',
      category: 'dairy_products',
      quantity: 30,
      remainingQuantity: 30,
      unit: 'packets',
      dietaryType: 'vegetarian',
      preparationTime: new Date(now.getTime() - 8 * 3600 * 1000),
      expiryTime: new Date(now.getTime() + 16 * 3600 * 1000), // 16 hours left
      pickupAddress: 'Crust & Crumb Cold Storage, Koramangala',
      location: {
        type: 'Point',
        coordinates: [77.6229, 12.9352]
      },
      storageInstructions: 'Strict refrigeration between 2°C and 4°C required during transport.',
      isRefrigerationRequired: true,
      donorId: donorBakery._id,
      status: 'available',
      viewsCount: 22
    });

    const listing6 = await FoodListing.create({
      title: 'Tandoori Chicken & Fragrant Chicken Biryani',
      description: 'High-grade non-vegetarian main course buffet surplus from evening reception.',
      category: 'cooked_meals',
      quantity: 50,
      remainingQuantity: 50,
      unit: 'meals',
      dietaryType: 'non-vegetarian',
      preparationTime: new Date(now.getTime() - 2 * 3600 * 1000),
      expiryTime: new Date(now.getTime() + 3.5 * 3600 * 1000), // 3.5 hours left
      pickupAddress: 'The Grand Orchid Banquets, 100 Ft Rd, Indiranagar',
      location: {
        type: 'Point',
        coordinates: [77.6408, 12.9784]
      },
      storageInstructions: 'Consume or distribute immediately.',
      isRefrigerationRequired: false,
      donorId: donorHotel._id,
      status: 'available',
      viewsCount: 28
    });

    // Overdue/expired listing for testing admin cleanup functionality
    const expiredListing = await FoodListing.create({
      title: 'South Indian Breakfast Mini Idlis & Chutney',
      description: 'Early morning breakfast buffet surplus.',
      category: 'cooked_meals',
      quantity: 30,
      remainingQuantity: 30,
      unit: 'meals',
      dietaryType: 'vegetarian',
      preparationTime: new Date(now.getTime() - 14 * 3600 * 1000),
      expiryTime: new Date(now.getTime() - 2 * 3600 * 1000), // Expired 2 hours ago
      pickupAddress: 'Apex Dining Hall A, Whitefield',
      location: {
        type: 'Point',
        coordinates: [77.7499, 12.9698]
      },
      storageInstructions: 'Expired',
      donorId: donorCanteen._id,
      status: 'available', // Intentionally available so admin cleanup demo detects and fixes it!
      viewsCount: 11
    });

    // 3. Create Donation Requests & Pickups
    console.log('🤝 Creating donation requests and pickup records...');

    // Request 1: Approved and Scheduled
    const request1 = await DonationRequest.create({
      listingId: listing1._id,
      recipientId: ngoHope._id,
      donorId: donorHotel._id,
      requestedQuantity: 25,
      unit: 'meals',
      peopleToFeed: 30,
      pickupDetails: {
        proposedTime: new Date(now.getTime() + 1.5 * 3600 * 1000),
        vehicleType: 'van',
        contactPerson: 'Sister Mary Joseph',
        contactPhone: '+91 99001 22334'
      },
      message: 'We have 30 senior citizens and children at the shelter ready for hot lunch.',
      status: 'approved',
      reviewedAt: new Date(now.getTime() - 30 * 60 * 1000)
    });

    const pickup1 = await PickupRecord.create({
      requestId: request1._id,
      listingId: listing1._id,
      recipientId: ngoHope._id,
      donorId: donorHotel._id,
      quantity: 25,
      unit: 'meals',
      scheduledPickupTime: new Date(now.getTime() + 1.5 * 3600 * 1000),
      verificationCode: '482910',
      status: 'scheduled',
      recipientNotes: 'Van is arriving at Indiranagar around 2:30 PM with food transport containers.'
    });

    // Historical Completed Request & Pickup (for Analytics & Charts demonstration)
    const pastListing = await FoodListing.create({
      title: 'Vegetable Pulao & Raita Chafing Pans',
      description: 'Wedding reception catering surplus successfully redistributed.',
      category: 'cooked_meals',
      quantity: 120,
      remainingQuantity: 0,
      unit: 'meals',
      dietaryType: 'vegetarian',
      preparationTime: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      expiryTime: new Date(now.getTime() - 4.8 * 24 * 3600 * 1000),
      pickupAddress: 'The Grand Orchid Kitchen Bay, Indiranagar',
      location: {
        type: 'Point',
        coordinates: [77.6408, 12.9784]
      },
      donorId: donorHotel._id,
      status: 'claimed'
    });

    const historicalRequest = await DonationRequest.create({
      listingId: pastListing._id,
      recipientId: ngoAnnapoorna._id,
      donorId: donorHotel._id,
      requestedQuantity: 120,
      unit: 'meals',
      peopleToFeed: 120,
      pickupDetails: {
        proposedTime: new Date(now.getTime() - 5 * 24 * 3600 * 1000 + 2 * 3600 * 1000),
        vehicleType: 'van',
        contactPerson: 'Suresh Kulkarni',
        contactPhone: '+91 98450 67890'
      },
      message: 'Urgent distribution for evening community meal in Jayanagar.',
      status: 'completed',
      createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000)
    });

    await PickupRecord.create({
      requestId: historicalRequest._id,
      listingId: pastListing._id,
      recipientId: ngoAnnapoorna._id,
      donorId: donorHotel._id,
      quantity: 120,
      unit: 'meals',
      scheduledPickupTime: new Date(now.getTime() - 5 * 24 * 3600 * 1000 + 2 * 3600 * 1000),
      actualPickupTime: new Date(now.getTime() - 5 * 24 * 3600 * 1000 + 2.5 * 3600 * 1000),
      verificationCode: '719342',
      status: 'completed',
      feedback: {
        rating: 5,
        comments: 'Outstanding quality food. Fed 120 children and families with zero waste.',
        submittedAt: new Date(now.getTime() - 4.9 * 24 * 3600 * 1000)
      }
    });

    // 4. Create Notifications
    console.log('🔔 Creating notifications...');
    await Notification.create([
      {
        recipientUserId: donorHotel._id,
        title: 'New Donation Claim Received',
        message: 'Hope Community Kitchen & Shelter requested 25 meals of Paneer Butter Masala.',
        type: 'request_received',
        link: '/requests',
        isRead: false
      },
      {
        recipientUserId: ngoHope._id,
        title: 'Donation Request Approved! 🎉',
        message: 'The Grand Orchid approved your claim for 25 meals. Pickup PIN: 482910.',
        type: 'request_approved',
        link: '/pickups',
        isRead: false
      },
      {
        recipientUserId: adminUser._id,
        title: 'New NGO Pending Verification',
        message: 'Sunrise Urban Night Shelter (Malleshwaram) registered and needs identity verification.',
        type: 'verification_update',
        link: '/admin/users',
        isRead: false
      }
    ]);

    // 5. Create Audit Logs
    console.log('📜 Creating audit log entries...');
    await AuditLog.create([
      {
        userId: donorHotel._id,
        userRole: 'donor',
        action: 'LISTING_CREATE',
        entityType: 'FoodListing',
        entityId: listing1._id,
        details: { title: listing1.title, quantity: 60, unit: 'meals' }
      },
      {
        userId: ngoHope._id,
        userRole: 'recipient',
        action: 'REQUEST_CREATE',
        entityType: 'DonationRequest',
        entityId: request1._id,
        details: { requestedQuantity: 25, listingTitle: listing1.title }
      },
      {
        userId: donorHotel._id,
        userRole: 'donor',
        action: 'REQUEST_APPROVED',
        entityType: 'DonationRequest',
        entityId: request1._id,
        details: { status: 'approved', pickupCode: '482910' }
      }
    ]);

    console.log('\n=============================================================');
    console.log('🎉 FoodRescue Database Seed Completed Successfully!');
    console.log('=============================================================');
    console.log('Demo Credentials for College Presentation:');
    console.log('-------------------------------------------------------------');
    console.log('1. Admin:');
    console.log('   Email:    admin@foodrescue.org');
    console.log('   Password: AdminPassword123!\n');
    console.log('2. Donor:');
    console.log('   Email:    donor@foodrescue.org');
    console.log('   Password: DonorPassword123!\n');
    console.log('3. Recipient / NGO:');
    console.log('   Email:    ngo@foodrescue.org');
    console.log('   Password: NgoPassword123!\n');
    console.log('4. Pending NGO (Admin Verification demo):');
    console.log('   Email:    newngo@shelter.org');
    console.log('   Password: NgoPassword123!');
    console.log('=============================================================\n');

    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
