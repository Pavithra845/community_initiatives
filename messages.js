const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// @route   GET /api/messages
// @desc    Get user's messages (inbox)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
      .populate('initiative', 'title')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/sent
// @desc    Get user's sent messages
// @access  Private
router.get('/sent', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ sender: req.user.id })
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
      .populate('initiative', 'title')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ sender: req.user.id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:id
// @desc    Get a specific message
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name avatar email')
      .populate('recipient', 'name avatar email')
      .populate('initiative', 'title')
      .populate('event', 'title');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender._id.toString() !== req.user.id && 
        message.recipient._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if recipient is viewing
    if (message.recipient._id.toString() === req.user.id && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', [
  auth,
  [
    body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
    body('subject').isLength({ min: 1, max: 100 }).withMessage('Subject is required (max 100 chars)'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('Content is required (max 2000 chars)'),
    body('messageType').optional().isIn(['personal', 'initiative', 'event', 'system'])
      .withMessage('Valid message type is required'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Valid priority is required')
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { recipient, subject, content, messageType, priority, initiative, event } = req.body;

    // Check if recipient exists
    const recipientExists = await User.findById(recipient);
    if (!recipientExists) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Don't allow sending message to self
    if (recipient === req.user.id) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const message = new Message({
      sender: req.user.id,
      recipient,
      subject,
      content,
      messageType: messageType || 'personal',
      priority: priority || 'normal',
      initiative,
      event
    });

    await message.save();

    await message.populate('sender', 'name avatar');
    await message.populate('recipient', 'name avatar');
    if (initiative) await message.populate('initiative', 'title');
    if (event) await message.populate('event', 'title');

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the recipient
    if (message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender.toString() !== req.user.id && 
        message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.remove();
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 