const express = require('express');
const Startup = require('../models/Startup');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get investment analytics by sector
router.get('/investments/by-sector', auth, requireRole(['investor']), async (req, res) => {
  try {
    const sectorAnalytics = await Startup.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$sector',
          totalInvested: { $sum: '$funding.currentAmount' },
          totalStartups: { $sum: 1 },
          avgFunding: { $avg: '$funding.currentAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: sectorAnalytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's investment performance
router.get('/portfolio/performance', auth, requireRole(['investor']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    res.json({
      success: true,
      data: {
        totalInvested: user.investorProfile.totalInvested,
        portfolioValue: user.investorProfile.portfolioValue,
        totalReturns: user.investorProfile.totalReturns,
        roi: user.investorProfile.totalInvested > 0 
          ? ((user.investorProfile.totalReturns / user.investorProfile.totalInvested) * 100) 
          : 0
      }
    });

  } catch (error) {
    console.error('Portfolio performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio performance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;