const express = require('express');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user profile by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// Get top investors
router.get('/leaderboard/investors', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topInvestors = await User.getTopInvestors(Number(limit));

    res.json({
      success: true,
      data: topInvestors,
    });
  } catch (error) {
    console.error('Get top investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top investors',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

module.exports = router;
