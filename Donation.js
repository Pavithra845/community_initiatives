const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  initiative: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Initiative',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'cash', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  message: {
    type: String,
    maxlength: 500
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  receipt: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
donationSchema.index({ initiative: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ status: 1 });

module.exports = mongoose.model('Donation', donationSchema); 