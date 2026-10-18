import mongoose from 'mongoose';

const donationRequestSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: [true, 'Listing ID is required'],
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [1, 'Requested quantity must be at least 1']
    },
    unit: {
      type: String,
      default: 'meals'
    },
    peopleToFeed: {
      type: Number,
      required: [true, 'Number of people to feed is required'],
      min: [1, 'Must feed at least 1 person']
    },
    pickupDetails: {
      proposedTime: {
        type: Date,
        required: [true, 'Proposed pickup time is required']
      },
      vehicleType: {
        type: String,
        enum: ['bike', 'auto', 'car', 'van', 'on_foot', 'other'],
        default: 'van'
      },
      contactPerson: {
        type: String,
        trim: true,
        default: ''
      },
      contactPhone: {
        type: String,
        trim: true,
        default: ''
      }
    },
    message: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast lookup and request filtering
donationRequestSchema.index({ listingId: 1, recipientId: 1 });
donationRequestSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
donationRequestSchema.index({ donorId: 1, status: 1, createdAt: -1 });

const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);
export default DonationRequest;
