const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema({
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
    enum: ['Environment', 'Education', 'Health', 'Technology', 'Arts', 'Sports', 'Social', 'Community Development', 'Other']
  },
  location: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'paused'],
    default: 'planning'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  // Enhanced social impact tracking
  impactScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  impactMetrics: {
    peopleReached: { type: Number, default: 0 },
    hoursVolunteered: { type: Number, default: 0 },
    fundsRaised: { type: Number, default: 0 },
    environmentalImpact: { type: Number, default: 0 },
    socialConnections: { type: Number, default: 0 }
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
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completed: { type: Boolean, default: false },
    completedDate: Date
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
  // Past connections tracking
  pastConnections: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    connectionType: {
      type: String,
      enum: ['volunteer', 'donor', 'participant', 'organizer']
    },
    date: {
      type: Date,
      default: Date.now
    },
    impact: String
  }],
  // Event connections
  relatedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
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
  }
}, {
  timestamps: true
});

// Calculate average rating when feedback is added/updated
initiativeSchema.pre('save', function(next) {
  if (this.feedback && this.feedback.length > 0) {
    const totalRating = this.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
    this.averageRating = totalRating / this.feedback.length;
    this.totalRatings = this.feedback.length;
  }
  next();
});

// Calculate impact score based on various metrics
initiativeSchema.methods.calculateImpactScore = function() {
  const metrics = this.impactMetrics;
  let score = 0;
  
  // People reached (max 25 points)
  score += Math.min(metrics.peopleReached / 100, 25);
  
  // Hours volunteered (max 25 points)
  score += Math.min(metrics.hoursVolunteered / 100, 25);
  
  // Funds raised (max 20 points)
  score += Math.min(metrics.fundsRaised / 1000, 20);
  
  // Environmental impact (max 15 points)
  score += Math.min(metrics.environmentalImpact, 15);
  
  // Social connections (max 15 points)
  score += Math.min(metrics.socialConnections / 10, 15);
  
  this.impactScore = Math.round(score);
  return this.impactScore;
};

// Add feedback method
initiativeSchema.methods.addFeedback = function(userId, rating, comment) {
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
initiativeSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content
  });
  
  return this.save();
};

// Track past connection
initiativeSchema.methods.addPastConnection = function(userId, connectionType, impact) {
  this.pastConnections.push({
    user: userId,
    connectionType,
    impact
  });
  
  return this.save();
};

// Index for search functionality
initiativeSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Initiative', initiativeSchema); 