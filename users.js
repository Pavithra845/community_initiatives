const express = require('express');
const User = require('../models/User');
const Initiative = require('../models/Initiative');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('createdInitiatives', 'title description category status')
      .populate('joinedInitiatives', 'title description category status');

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdInitiatives', 'title description category status')
      .populate('joinedInitiatives', 'title description category status');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id/initiatives
// @desc    Get user's initiatives
// @access  Public
router.get('/:id/initiatives', async (req, res) => {
  try {
    const initiatives = await Initiative.find({
      $or: [
        { creator: req.params.id },
        { 'members.user': req.params.id }
      ],
      isPublic: true
    })
    .populate('creator', 'name avatar')
    .populate('members.user', 'name avatar')
    .sort({ createdAt: -1 });

    res.json(initiatives);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id/events
// @desc    Get user's events
// @access  Public
router.get('/:id/events', async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { organizer: req.params.id },
        { 'attendees.user': req.params.id }
      ],
      isPublic: true
    })
    .populate('organizer', 'name avatar')
    .populate('initiative', 'title')
    .populate('attendees.user', 'name avatar')
    .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/search
// @desc    Search users
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, location, interests, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (interests) {
      query.interests = { $in: interests.split(',') };
    }

    const users = await User.find(query)
      .select('name avatar bio location interests')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 