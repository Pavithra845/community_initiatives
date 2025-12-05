const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['Community', 'Education', 'Health', 'Environment', 'Arts', 'Sports', 'Technology', 'Social', 'Fundraiser', 'Workshop', 'Other']
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiative: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Initiative'
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  capacity: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  isFree: {
    type: Boolean,
    default: true
  },
  ticketPrice: {
    type: Number,
    default: 0
  },
  ticketUrl: {
    type: String
  },
  contactInfo: {
    email: String,
    phone: String
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  // Enhanced event tracking
  eventMetrics: {
    totalAttendees: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  },
  // Feedback and reviews system
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  // Event details
  agenda: [{
    time: String,
    activity: String,
    description: String
  }],
  speakers: [{
    name: String,
    title: String,
    bio: String,
    avatar: String
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String
  }],
  // Community engagement
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  // Past event tracking
  pastEvents: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    date: Date,
    attendees: Number,
    feedback: String
  }],
  // Initiative connections
  relatedInitiatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Initiative'
  }],
  // Social impact
  socialImpact: {
    peopleConnected: { type: Number, default: 0 },
    knowledgeShared: { type: Number, default: 0 },
    communityBuilding: { type: Number, default: 0 },
    environmentalImpact: { type: Number, default: 0 }
  },
  // Visibility and sharing
  isPublic: {
    type: Boolean,
    default: true
  },
  shareCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // Event reminders
  reminders: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reminderTime: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Calculate average rating when feedback is added/updated
eventSchema.pre('save', function(next) {
  if (this.feedback && this.feedback.length > 0) {
    const totalRating = this.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
    this.averageRating = totalRating / this.feedback.length;
    this.totalRatings = this.feedback.length;
  }
  
  // Calculate engagement rate
  if (this.attendees && this.attendees.length > 0) {
    this.eventMetrics.engagementRate = (this.likes.length / this.attendees.length) * 100;
  }
  
  next();
});

// Add feedback method
eventSchema.methods.addFeedback = function(userId, rating, comment) {
  // Remove existing feedback from this user
  this.feedback = this.feedback.filter(f => f.user.toString() !== userId.toString());
  
  // Add new feedback
  this.feedback.push({
    user: userId,
    rating,
    comment
  });
  
  return this.save();
};

// Add comment method
eventSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content
  });
  
  return this.save();
};

// Track attendance
eventSchema.methods.addAttendee = function(userId) {
  if (!this.attendees.includes(userId)) {
    this.attendees.push(userId);
    this.eventMetrics.totalAttendees = this.attendees.length;
  }
  return this.save();
};

// Remove attendee
eventSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(id => id.toString() !== userId.toString());
  this.eventMetrics.totalAttendees = this.attendees.length;
  return this.save();
};

// Calculate social impact score
eventSchema.methods.calculateSocialImpact = function() {
  const impact = this.socialImpact;
  let score = 0;
  
  // People connected (max 30 points)
  score += Math.min(impact.peopleConnected / 10, 30);
  
  // Knowledge shared (max 25 points)
  score += Math.min(impact.knowledgeShared / 5, 25);
  
  // Community building (max 25 points)
  score += Math.min(impact.communityBuilding / 5, 25);
  
  // Environmental impact (max 20 points)
  score += Math.min(impact.environmentalImpact, 20);
  
  return Math.round(score);
};

// Add reminder
eventSchema.methods.addReminder = function(userId, reminderTime) {
  this.reminders.push({
    user: userId,
    reminderTime
  });
  
  return this.save();
};

// Index for date-based queries
eventSchema.index({ date: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema); 