const express = require('express');
const { check, validationResult } = require('express-validator');
const Initiative = require('../models/Initiative');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/initiatives
// @desc    Get all initiatives
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, location, status, search, page = 1, limit = 10 } = req.query;
    
    const query = { isPublic: true };
    
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const initiatives = await Initiative.find(query)
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Initiative.countDocuments(query);

    res.json({
      initiatives,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/initiatives/:id
// @desc    Get initiative by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id)
      .populate('creator', 'name avatar bio location')
      .populate('members.user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .populate('likes', 'name');

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    res.json(initiative);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Initiative not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/initiatives
// @desc    Create a new initiative
// @access  Private
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      tags,
      goals,
      budget,
      contactInfo,
      socialMedia
    } = req.body;

    const newInitiative = new Initiative({
      title,
      description,
      category,
      location,
      creator: req.user.id,
      startDate,
      endDate,
      tags: tags || [],
      goals: goals || [],
      budget,
      contactInfo,
      socialMedia
    });

    const initiative = await newInitiative.save();

    // Add creator as first member
    initiative.members.push(req.user.id);

    await initiative.save();

    // Update user's created initiatives
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdInitiatives: initiative._id }
    });

    await initiative.populate('creator', 'name avatar');
    await initiative.populate('members', 'name avatar');

    res.json(initiative);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/initiatives/:id
// @desc    Update initiative
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    // Check if user is creator or admin
    if (initiative.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedInitiative = await Initiative.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    )
    .populate('creator', 'name avatar')
    .populate('members.user', 'name avatar');

    res.json(updatedInitiative);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Initiative not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/initiatives/:id
// @desc    Delete initiative
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    // Check if user is creator or admin
    if (initiative.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await initiative.remove();

    res.json({ message: 'Initiative removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Initiative not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/initiatives/:id/join
// @desc    Join an initiative
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    // Check if user is already a member
    const isMember = initiative.members.find(
      member => member.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ message: 'Already a member of this initiative' });
    }

    initiative.members.push({
      user: req.user.id,
      role: req.body.role || 'member'
    });

    await initiative.save();

    // Update user's joined initiatives
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedInitiatives: initiative._id }
    });

    await initiative.populate('creator', 'name avatar');
    await initiative.populate('members.user', 'name avatar');

    res.json(initiative);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/initiatives/:id/like
// @desc    Like/unlike an initiative
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    const likeIndex = initiative.likes.findIndex(
      like => like.toString() === req.user.id
    );

    if (likeIndex > -1) {
      initiative.likes.splice(likeIndex, 1);
    } else {
      initiative.likes.push(req.user.id);
    }

    await initiative.save();
    res.json(initiative);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/initiatives/:id/comment
// @desc    Add comment to initiative
// @access  Private
router.post('/:id/comment', [
  auth,
  [check('text', 'Text is required').not().isEmpty()]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const initiative = await Initiative.findById(req.params.id);

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    const newComment = {
      user: req.user.id,
      text: req.body.text
    };

    initiative.comments.unshift(newComment);
    await initiative.save();

    await initiative.populate('comments.user', 'name avatar');
    res.json(initiative.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 