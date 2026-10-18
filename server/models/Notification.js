import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'request_received',
        'request_approved',
        'request_rejected',
        'pickup_scheduled',
        'pickup_completed',
        'listing_expiring',
        'verification_update',
        'system'
      ],
      default: 'system'
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    // Advanced MongoDB TTL Index:
    // Notifications expire automatically after 30 days (2,592,000 seconds)
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 2592000 } // TTL index in MongoDB
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user unread notifications
notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
