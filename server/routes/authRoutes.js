import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'foodrescue_jwt_super_secure_secret_key_2026_ad_project';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'recipient',
      phone = '',
      organizationDetails = {},
      location = {}
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Default coordinates if not provided (Bangalore coords)
    const coordinates = location.coordinates && location.coordinates.length === 2
      ? [Number(location.coordinates[0]), Number(location.coordinates[1])]
      : [77.5946, 12.9716];

    // For demonstration, new donors and recipients default to verified (or pending if unverified test is requested)
    const verificationStatus = role === 'admin' ? 'verified' : (req.body.verificationStatus || 'verified');

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      organizationDetails: {
        orgName: organizationDetails.orgName || name,
        orgType: organizationDetails.orgType || 'other',
        registrationNumber: organizationDetails.registrationNumber || '',
        capacityDailyMeals: Number(organizationDetails.capacityDailyMeals) || 50,
        description: organizationDetails.description || ''
      },
      location: {
        type: 'Point',
        coordinates,
        address: location.address || 'Central City, Karnataka',
        city: location.city || 'Bangalore'
      },
      verificationStatus,
      verifiedAt: verificationStatus === 'verified' ? new Date() : null
    });

    const token = generateToken(newUser._id);

    await logAudit({
      req,
      userId: newUser._id,
      userRole: newUser.role,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: newUser._id,
      details: { email: newUser.email, role: newUser.role }
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while registering user.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const token = generateToken(user._id);

    await logAudit({
      req,
      userId: user._id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email }
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login.'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, organizationDetails, location } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (organizationDetails) {
      user.organizationDetails = {
        ...user.organizationDetails?.toObject(),
        ...organizationDetails
      };
    }

    if (location) {
      if (location.address) user.location.address = location.address;
      if (location.city) user.location.city = location.city;
      if (location.coordinates && location.coordinates.length === 2) {
        user.location.coordinates = [
          Number(location.coordinates[0]),
          Number(location.coordinates[1])
        ];
      }
    }

    await user.save();

    await logAudit({
      req,
      userId: user._id,
      userRole: user.role,
      action: 'PROFILE_UPDATE',
      entityType: 'User',
      entityId: user._id,
      details: { updatedFields: Object.keys(req.body) }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
