const express = require('express');
const { body, validationResult } = require('express-validator');
const Startup = require('../models/Startup');
const User = require('../models/User');
const { auth, requireRole, requireKYC } = require('../middleware/auth');

const router = express.Router();

// Create investment
router.post(
  '/',
  auth,
  requireRole(['investor']),
  requireKYC,
  [
    body('startupId').isMongoId().withMessage('Valid startup ID is required'),
    body('amount')
      .isFloat({ min: 100 })
      .withMessage('Minimum investment amount is 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { startupId, amount } = req.body;

      const startup = await Startup.findById(startupId);
      if (!startup || startup.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Startup not found or not accepting investments',
        });
      }

      const user = await User.findById(req.user.userId);

      // Check investment limits
      if (amount < startup.funding.minimumInvestment) {
        return res.status(400).json({
          success: false,
          message: `Minimum investment amount is ${startup.funding.minimumInvestment}`,
        });
      }

      if (
        startup.funding.maximumInvestment &&
        amount > startup.funding.maximumInvestment
      ) {
        return res.status(400).json({
          success: false,
          message: `Maximum investment amount is ${startup.funding.maximumInvestment}`,
        });
      }

      // Check if funding goal would be exceeded
      if (
        startup.funding.currentAmount + amount >
        startup.funding.targetAmount
      ) {
        return res.status(400).json({
          success: false,
          message: 'Investment amount exceeds remaining funding requirement',
        });
      }

      // Add investment
      await startup.addInvestment(req.user.userId, amount, `INV_${Date.now()}`);

      // Update user investment profile
      user.investorProfile.totalInvested += amount;
      user.investorProfile.investmentHistory.push({
        startupId: startup._id,
        amount: amount,
        currentValue: amount,
        status: 'active',
      });
      await user.save();

      res.json({
        success: true,
        message: 'Investment successful',
        data: {
          investment: {
            startupId,
            amount,
            date: new Date(),
          },
          startup: {
            name: startup.name,
            fundingProgress: startup.fundingProgress,
          },
        },
      });
    } catch (error) {
      console.error('Investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Investment failed',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      });
    }
  },
);

// Get user's investment portfolio
router.get('/portfolio', auth, requireRole(['investor']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      'investorProfile.investmentHistory.startupId',
      'name logo sector funding'
    );

    res.json({
      success: true,
      data: {
        totalInvested: user.investorProfile.totalInvested,
        portfolioValue: user.investorProfile.portfolioValue,
        totalReturns: user.investorProfile.totalReturns,
        investments: user.investorProfile.investmentHistory,
      },
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

module.exports = router;
