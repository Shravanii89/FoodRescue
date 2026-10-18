import mongoose from 'mongoose';

const foodListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Food title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'cooked_meals',
          'raw_ingredients',
          'bakery',
          'packaged_goods',
          'fruits_vegetables',
          'dairy_products',
          'beverages',
          'other'
        ],
        message: '{VALUE} is not a valid food category'
      },
      default: 'cooked_meals'
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: [0, 'Remaining quantity cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Unit of measure is required'],
      enum: ['meals', 'kg', 'plates', 'packets', 'litres', 'boxes', 'portions'],
      default: 'meals'
    },
    dietaryType: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'halal', 'jain', 'mixed'],
      default: 'vegetarian'
    },
    preparationTime: {
      type: Date,
      required: [true, 'Preparation time is required'],
      default: Date.now
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
      index: true
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true
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
      }
    },
    storageInstructions: {
      type: String,
      trim: true,
      default: 'Keep covered in a clean, cool area or refrigerate below 4°C.'
    },
    isRefrigerationRequired: {
      type: Boolean,
      default: false
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['available', 'partially_claimed', 'claimed', 'expired', 'cancelled'],
      default: 'available',
      index: true
    },
    peopleFedEstimate: {
      type: Number,
      default: function () {
        // Simple heuristic estimate
        if (this.unit === 'meals' || this.unit === 'plates' || this.unit === 'portions') {
          return this.quantity;
        }
        if (this.unit === 'kg') {
          return Math.round(this.quantity * 2.5); // ~400g per meal
        }
        return this.quantity;
      }
    },
    viewsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Advanced MongoDB Indexes
// 1. Compound index for fast queries by listing status, category, and expiry time
foodListingSchema.index({ status: 1, category: 1, expiryTime: 1 });

// 2. Geospatial 2dsphere index for nearby discovery
foodListingSchema.index({ location: '2dsphere' });

// 3. Donor query optimization
foodListingSchema.index({ donorId: 1, createdAt: -1 });

// Virtual to check if expired
foodListingSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryTime;
});

// Pre-save hook to initialize remainingQuantity if not provided
foodListingSchema.pre('validate', function (next) {
  if (this.isNew && (this.remainingQuantity === undefined || this.remainingQuantity === null)) {
    this.remainingQuantity = this.quantity;
  }
  next();
});

const FoodListing = mongoose.model('FoodListing', foodListingSchema);
export default FoodListing;
