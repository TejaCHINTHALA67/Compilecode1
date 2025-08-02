const express = require('express');
const { body, validationResult } = require('express-validator');
const aiRecommendationService = require('../services/aiRecommendationService');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get AI-powered startup recommendations for investors
router.get('/startups', auth, requireRole(['investor']), async (req, res) => {
  try {
    const { limit = 10, refresh = false } = req.query;
    
    // If refresh is true, recalculate recommendations
    if (refresh === 'true') {
      await aiRecommendationService.updateAllStartupAIScores();
    }
    
    const recommendations = await aiRecommendationService.getStartupRecommendationsForInvestor(
      req.user.userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        recommendations,
        totalCount: recommendations.length,
        aiPowered: true
      }
    });

  } catch (error) {
    console.error('Get startup recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get startup recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get AI-powered investor recommendations for startups
router.get('/investors/:startupId', auth, requireRole(['entrepreneur']), async (req, res) => {
  try {
    const { startupId } = req.params;
    const { limit = 10 } = req.query;
    
    const recommendations = await aiRecommendationService.getInvestorRecommendationsForStartup(
      startupId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        recommendations,
        totalCount: recommendations.length,
        aiPowered: true
      }
    });

  } catch (error) {
    console.error('Get investor recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get investor recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get trending sectors with AI insights
router.get('/trending-sectors', auth, async (req, res) => {
  try {
    const trendingData = await aiRecommendationService.getTrendingSectors();
    
    res.json({
      success: true,
      data: {
        sectors: trendingData,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get trending sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending sectors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update investor preferences for better AI recommendations
router.put('/preferences', auth, requireRole(['investor']), [
  body('preferredSectors').optional().isArray().withMessage('Preferred sectors must be an array'),
  body('riskTolerance').optional().isIn(['conservative', 'moderate', 'aggressive']).withMessage('Invalid risk tolerance'),
  body('investmentCapacity').optional().isFloat({ min: 0 }).withMessage('Investment capacity must be a positive number'),
  body('preferredStages').optional().isArray().withMessage('Preferred stages must be an array'),
  body('geographicPreferences').optional().isArray().withMessage('Geographic preferences must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      preferredSectors,
      riskTolerance,
      investmentCapacity,
      preferredStages,
      geographicPreferences
    } = req.body;

    // Update user's investor profile
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (preferredSectors) user.investorProfile.preferredSectors = preferredSectors;
    if (riskTolerance) user.investorProfile.riskTolerance = riskTolerance;
    if (investmentCapacity) user.investorProfile.investmentCapacity = investmentCapacity;
    if (preferredStages) user.investorProfile.preferredStages = preferredStages;
    if (geographicPreferences) user.investorProfile.geographicPreferences = geographicPreferences;

    await user.save();

    // Get updated recommendations
    const recommendations = await aiRecommendationService.getStartupRecommendationsForInvestor(
      req.user.userId,
      5
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        updatedPreferences: user.investorProfile,
        newRecommendations: recommendations
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get AI insights for a specific startup
router.get('/insights/startup/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const Startup = require('../models/Startup');
    const startup = await Startup.findById(id).populate('founder');
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    // Calculate detailed AI scores
    const generalScore = await aiRecommendationService.calculateGeneralStartupScore(startup);
    
    // Get personalized score if user is an investor
    let personalizedScore = null;
    if (req.userProfile.userType === 'investor' || req.userProfile.userType === 'both') {
      personalizedScore = await aiRecommendationService.calculateStartupScore(startup, req.userProfile);
    }

    // Get similar startups
    const similarStartups = await Startup.find({
      sector: startup.sector,
      stage: startup.stage,
      _id: { $ne: startup._id },
      status: 'active',
      moderationStatus: 'approved'
    }).limit(5).select('name tagline funding.targetAmount aiScore.overall');

    res.json({
      success: true,
      data: {
        startupId: startup._id,
        generalScores: {
          overall: Object.values(generalScore).reduce((a, b) => a + b, 0) / 5,
          breakdown: generalScore
        },
        personalizedScore: personalizedScore,
        insights: {
          strengths: this.generateInsights(startup, generalScore, 'strengths'),
          challenges: this.generateInsights(startup, generalScore, 'challenges'),
          opportunities: this.generateInsights(startup, generalScore, 'opportunities')
        },
        similarStartups,
        recommendations: personalizedScore ? 
          aiRecommendationService.generateRecommendationReasons(startup, req.userProfile, personalizedScore) : 
          []
      }
    });

  } catch (error) {
    console.error('Get startup insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get startup insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate AI-powered investment suggestions
router.post('/suggest-investment', auth, requireRole(['investor']), [
  body('startupId').isMongoId().withMessage('Valid startup ID is required'),
  body('riskLevel').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid risk level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { startupId, riskLevel = 'medium' } = req.body;
    
    const Startup = require('../models/Startup');
    const User = require('../models/User');
    
    const startup = await Startup.findById(startupId);
    const investor = await User.findById(req.user.userId);
    
    if (!startup || !investor) {
      return res.status(404).json({
        success: false,
        message: 'Startup or investor not found'
      });
    }

    // Calculate AI score for this specific startup-investor pair
    const matchScore = await aiRecommendationService.calculateStartupScore(startup, investor);
    
    // Generate investment suggestion based on AI analysis
    const suggestion = this.generateInvestmentSuggestion(startup, investor, matchScore, riskLevel);

    res.json({
      success: true,
      data: {
        matchScore,
        suggestion,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate investment suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate investment suggestion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Batch update AI scores (admin/cron job endpoint)
router.post('/update-scores', auth, async (req, res) => {
  try {
    // Only allow for admin users or system calls
    if (req.userProfile.userType !== 'admin' && !req.headers['x-system-call']) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    await aiRecommendationService.updateAllStartupAIScores();

    res.json({
      success: true,
      message: 'AI scores updated successfully',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update AI scores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI scores',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function generateInsights(startup, scores, type) {
  const insights = [];
  
  switch (type) {
    case 'strengths':
      if (scores.team > 80) insights.push('Strong and experienced team');
      if (scores.market > 80) insights.push('Large and growing market opportunity');
      if (scores.traction > 80) insights.push('Excellent user traction and engagement');
      if (scores.financials > 80) insights.push('Strong financial performance');
      if (scores.product > 80) insights.push('Well-developed product with good user adoption');
      break;
      
    case 'challenges':
      if (scores.team < 50) insights.push('Team experience could be strengthened');
      if (scores.market < 50) insights.push('Market opportunity needs validation');
      if (scores.traction < 50) insights.push('User traction needs improvement');
      if (scores.financials < 50) insights.push('Financial metrics need development');
      if (scores.product < 50) insights.push('Product development in early stages');
      break;
      
    case 'opportunities':
      if (startup.sector === 'AI') insights.push('AI sector showing strong growth potential');
      if (startup.stage === 'mvp') insights.push('Good timing for seed investment');
      if (startup.metrics?.users?.growth > 50) insights.push('High user growth indicates scalability');
      if (startup.funding.currentAmount < startup.funding.targetAmount * 0.3) {
        insights.push('Early investment opportunity with potential for better terms');
      }
      break;
  }
  
  return insights.slice(0, 3);
}

function generateInvestmentSuggestion(startup, investor, matchScore, riskLevel) {
  const capacity = investor.investorProfile.investmentCapacity || 0;
  const minInvestment = startup.funding.minimumInvestment || 100;
  
  let suggestedAmount;
  let reasoning = [];
  
  // Calculate suggested investment amount based on risk level and capacity
  if (riskLevel === 'low') {
    suggestedAmount = Math.max(minInvestment, capacity * 0.02); // 2% of capacity
    reasoning.push('Conservative approach: Small allocation to test waters');
  } else if (riskLevel === 'medium') {
    suggestedAmount = Math.max(minInvestment, capacity * 0.05); // 5% of capacity
    reasoning.push('Balanced approach: Moderate allocation with good risk-reward ratio');
  } else {
    suggestedAmount = Math.max(minInvestment, capacity * 0.10); // 10% of capacity
    reasoning.push('Aggressive approach: Larger allocation for higher potential returns');
  }
  
  // Adjust based on AI match score
  if (matchScore > 80) {
    suggestedAmount *= 1.2;
    reasoning.push('AI analysis shows excellent match - increased allocation recommended');
  } else if (matchScore < 40) {
    suggestedAmount *= 0.7;
    reasoning.push('Lower AI match score - reduced allocation suggested');
  }
  
  // Ensure we don't exceed capacity or go below minimum
  suggestedAmount = Math.max(minInvestment, Math.min(suggestedAmount, capacity));
  
  return {
    amount: Math.round(suggestedAmount),
    currency: startup.funding.currency || 'USD',
    reasoning: reasoning,
    confidence: matchScore > 60 ? 'high' : matchScore > 40 ? 'medium' : 'low',
    timeframe: 'Consider investing within 7 days for optimal terms'
  };
}

module.exports = router;