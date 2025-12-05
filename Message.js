const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiative: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Initiative'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  messageType: {
    type: String,
    enum: ['personal', 'initiative', 'event', 'system'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ initiative: 1, createdAt: -1 });
messageSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema); 