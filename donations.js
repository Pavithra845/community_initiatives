const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Donation = require('../models/Donation');
const Initiative = require('../models/Initiative');
const { body, validationResult } = require('express-validator');

// @route   GET /api/donations
// @desc    Get all donations (admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const donations = await Donation.find()
      .populate('initiative', 'title')
      .populate('donor', 'name email')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donations/initiative/:id
// @desc    Get donations for a specific initiative
// @access  Public
router.get('/initiative/:id', async (req, res) => {
  try {
    const donations = await Donation.find({ 
      initiative: req.params.id,
      status: 'completed'
    })
      .populate('donor', 'name avatar')
      .sort({ createdAt: -1 });

    // Calculate total amount
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

    res.json({
      donations,
      totalAmount,
      totalDonations: donations.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donations/my-donations
// @desc    Get current user's donations
// @access  Private
router.get('/my-donations', auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate('initiative', 'title description images')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/donations
// @desc    Create a new donation
// @access  Private
router.post('/', [
  auth,
  [
    body('initiative').isMongoId().withMessage('Valid initiative ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod').isIn(['credit_card', 'paypal', 'bank_transfer', 'cash', 'other'])
      .withMessage('Valid payment method is required'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
    body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be boolean')
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { initiative, amount, currency, paymentMethod, message, isAnonymous } = req.body;

    // Check if initiative exists
    const initiativeExists = await Initiative.findById(initiative);
    if (!initiativeExists) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    // Create donation
    const donation = new Donation({
      initiative,
      donor: req.user.id,
      amount,
      currency: currency || 'USD',
      paymentMethod,
      message,
      isAnonymous: isAnonymous || false,
      status: 'pending'
    });

    await donation.save();

    // Populate references for response
    await donation.populate('initiative', 'title');
    await donation.populate('donor', 'name email');

    res.json(donation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/donations/:id/status
// @desc    Update donation status (admin only)
// @access  Private
router.put('/:id/status', [
  auth,
  [
    body('status').isIn(['pending', 'completed', 'failed', 'refunded'])
      .withMessage('Valid status is required'),
    body('transactionId').optional().isString().withMessage('Transaction ID must be string')
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, transactionId } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = status;
    if (transactionId) {
      donation.transactionId = transactionId;
    }

    await donation.save();

    await donation.populate('initiative', 'title');
    await donation.populate('donor', 'name email');

    res.json(donation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donations/stats
// @desc    Get donation statistics
// @access  Private (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const monthlyStats = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overall: stats[0] || { totalDonations: 0, totalAmount: 0, avgAmount: 0 },
      monthly: monthlyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
