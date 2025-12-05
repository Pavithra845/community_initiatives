const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'initiative_created',
      'initiative_updated',
      'initiative_joined',
      'event_created',
      'event_updated',
      'event_reminder',
      'event_attending',
      'donation_received',
      'message_received',
      'comment_added',
      'like_received',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative'
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema); 