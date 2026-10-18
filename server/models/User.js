import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['donor', 'recipient', 'admin'],
        message: '{VALUE} is not a valid user role'
      },
      required: true,
      default: 'recipient'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    organizationDetails: {
      orgName: { type: String, trim: true, default: '' },
      orgType: {
        type: String,
        enum: [
          'restaurant',
          'hotel',
          'canteen',
          'hostel',
          'bakery',
          'event_organizer',
          'ngo',
          'shelter',
          'community_kitchen',
          'individual_donor',
          'other'
        ],
        default: 'other'
      },
      registrationNumber: { type: String, trim: true, default: '' },
      capacityDailyMeals: { type: Number, default: 50, min: 0 },
      description: { type: String, trim: true, default: '' }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [77.5946, 12.9716]
      },
      address: {
        type: String,
        default: 'Bangalore Central, Karnataka, India'
      },
      city: {
        type: String,
        default: 'Bangalore'
      }
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified'
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
userSchema.index({ 'location': '2dsphere' });
userSchema.index({ role: 1, verificationStatus: 1 });

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
