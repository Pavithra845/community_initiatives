const express = require('express');
const { check, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, location, date, search, page = 1, limit = 10 } = req.query;
    
    const query = { isPublic: true };
    
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    if (search) {
      query.$text = { $search: search };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name avatar')
      .populate('initiative', 'title')
      .populate('attendees', 'name avatar')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar bio')
      .populate('initiative', 'title description')
      .populate('attendees', 'name avatar');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/events
// @desc    Create a new event
// @access  Private
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ]
], async (req, res) => {
  console.log('Event creation request received:', req.body);
  console.log('User:', req.user);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      date,
      endDate,
      location,
      address,
      coordinates,
      initiative,
      category,
      maxAttendees,
      images,
      tags,
      isFree,
      ticketPrice,
      ticketUrl,
      contactInfo,
      socialMedia
    } = req.body;

    console.log('Creating event with data:', {
      title,
      description,
      date,
      location,
      category,
      organizer: req.user.id
    });

    const newEvent = new Event({
      title,
      description,
      date,
      endDate,
      location,
      address,
      coordinates,
      organizer: req.user.id,
      initiative,
      category,
      maxAttendees,
      images: images || [],
      tags: tags || [],
      isFree,
      ticketPrice,
      ticketUrl,
      contactInfo,
      socialMedia
    });

    console.log('Event object created, saving...');
    const event = await newEvent.save();
    console.log('Event saved successfully:', event._id);

    // Add organizer as first attendee
    event.attendees.push(req.user.id);

    await event.save();
    console.log('Organizer added as attendee');

    await event.populate('organizer', 'name avatar');
    await event.populate('initiative', 'title');
    await event.populate('attendees', 'name avatar');

    console.log('Event populated and ready to send');
    res.json(event);
  } catch (error) {
    console.error('Error creating event:', error.message);
    console.error('Full error:', error);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    )
    .populate('organizer', 'name avatar')
    .populate('initiative', 'title')
    .populate('attendees', 'name avatar');

    res.json(updatedEvent);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await event.remove();

    res.json({ message: 'Event removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/events/:id/attend
// @desc    Attend an event
// @access  Private
router.post('/:id/attend', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already attending
    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.toString() === req.user.id
    );

    if (attendeeIndex > -1) {
      // User is already attending
      return res.status(400).json({ message: 'Already attending this event' });
    } else {
      // Check if event is full
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }

      event.attendees.push(req.user.id);
    }

    await event.save();

    await event.populate('organizer', 'name avatar');
    await event.populate('initiative', 'title');
    await event.populate('attendees', 'name avatar');

    res.json(event);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/events/:id/attend
// @desc    Remove attendance from event
// @access  Private
router.delete('/:id/attend', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.toString() === req.user.id
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({ message: 'Not attending this event' });
    }

    event.attendees.splice(attendeeIndex, 1);
    await event.save();

    await event.populate('organizer', 'name avatar');
    await event.populate('initiative', 'title');
    await event.populate('attendees', 'name avatar');

    res.json(event);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 