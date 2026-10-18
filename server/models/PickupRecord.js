import mongoose from 'mongoose';

const pickupRecordSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationRequest',
      required: true,
      unique: true,
      index: true
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'meals'
    },
    scheduledPickupTime: {
      type: Date,
      required: true
    },
    actualPickupTime: {
      type: Date
    },
    verificationCode: {
      type: String,
      required: true,
      default: () => Math.floor(100000 + Math.random() * 900000).toString()
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_transit', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    recipientNotes: {
      type: String,
      trim: true,
      default: ''
    },
    donorNotes: {
      type: String,
      trim: true,
      default: ''
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, trim: true, default: '' },
      submittedAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
pickupRecordSchema.index({ status: 1, scheduledPickupTime: 1 });
pickupRecordSchema.index({ recipientId: 1, status: 1 });
pickupRecordSchema.index({ donorId: 1, status: 1 });

const PickupRecord = mongoose.model('PickupRecord', pickupRecordSchema);
export default PickupRecord;
