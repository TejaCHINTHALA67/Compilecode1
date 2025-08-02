const express = require('express');
const Startup = require('../models/Startup');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const Investment = require('../models/Investment');

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

// AI Insights endpoint for startup and investor analysis
router.post('/ai-insights', auth, async (req, res) => {
  try {
    const { targetId, targetType, analysisType } = req.body;
    
    // Validate input
    if (!targetId || !targetType || !analysisType) {
      return res.status(400).json({ 
        message: 'targetId, targetType, and analysisType are required' 
      });
    }

    let insights = {};

    if (targetType === 'startup' && analysisType === 'investor_analysis') {
      // Analyze startup for potential investors
      const startup = await Startup.findById(targetId)
        .populate('founder', 'firstName lastName bio experience')
        .populate('team', 'firstName lastName role experience');

      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }

      // Get investors who have invested in similar startups
      const similarInvestments = await Investment.find({
        startup: { $ne: targetId },
        $or: [
          { 'startup.sector': startup.sector },
          { 'startup.stage': startup.stage }
        ]
      }).populate('investor', 'firstName lastName bio investmentFocus');

      const investorProfiles = await Promise.all(
        similarInvestments.map(async (investment) => {
          const investorData = await User.findById(investment.investor._id);
          const investorInvestments = await Investment.find({ investor: investment.investor._id })
            .populate('startup', 'name sector stage funding');

          return {
            investor: {
              id: investorData._id,
              name: `${investorData.firstName} ${investorData.lastName}`,
              bio: investorData.bio,
              profilePicture: investorData.profilePicture,
              investmentFocus: investorData.investmentFocus,
              totalInvestments: investorInvestments.length,
              averageInvestment: investorInvestments.reduce((sum, inv) => sum + inv.amount, 0) / investorInvestments.length,
              preferredSectors: [...new Set(investorInvestments.map(inv => inv.startup.sector))],
              preferredStages: [...new Set(investorInvestments.map(inv => inv.startup.stage))]
            },
            compatibilityScore: calculateCompatibilityScore(startup, investorData, investorInvestments),
            reasoning: generateInvestorReasoning(startup, investorData, investorInvestments)
          };
        })
      );

      // Sort by compatibility score and take top 10
      const topInvestors = investorProfiles
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 10);

      insights = {
        type: 'investor_analysis',
        startup: {
          name: startup.name,
          sector: startup.sector,
          stage: startup.stage,
          fundingTarget: startup.funding.targetAmount
        },
        recommendations: topInvestors,
        summary: generateStartupInsightsSummary(startup, topInvestors),
        analysisTimestamp: new Date()
      };

    } else if (targetType === 'investor' && analysisType === 'startup_analysis') {
      // Analyze investor for potential startup matches
      const investor = await User.findById(targetId);
      
      if (!investor) {
        return res.status(404).json({ message: 'Investor not found' });
      }

      // Get investor's investment history
      const investorInvestments = await Investment.find({ investor: targetId })
        .populate('startup', 'name sector stage funding');

      // Find startups that match investor's preferences
      const matchingStartups = await Startup.find({
        sector: { $in: investor.investmentFocus || [] },
        'funding.currentAmount': { $lt: '$funding.targetAmount' },
        isActive: true
      }).populate('founder', 'firstName lastName bio experience');

      const startupProfiles = matchingStartups.map(startup => {
        const compatibilityScore = calculateStartupCompatibilityScore(investor, startup, investorInvestments);
        return {
          startup: {
            id: startup._id,
            name: startup.name,
            tagline: startup.tagline,
            description: startup.description,
            logo: startup.logo,
            sector: startup.sector,
            stage: startup.stage,
            fundingProgress: {
              current: startup.funding.currentAmount,
              target: startup.funding.targetAmount,
              percentage: (startup.funding.currentAmount / startup.funding.targetAmount) * 100
            },
            founder: startup.founder,
            location: startup.location
          },
          compatibilityScore,
          reasoning: generateStartupReasoning(investor, startup, investorInvestments),
          riskAssessment: assessStartupRisk(startup),
          potentialReturns: estimatePotentialReturns(startup)
        };
      });

      // Sort by compatibility score and take top 15
      const topStartups = startupProfiles
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 15);

      insights = {
        type: 'startup_analysis',
        investor: {
          name: `${investor.firstName} ${investor.lastName}`,
          investmentFocus: investor.investmentFocus,
          totalInvestments: investorInvestments.length
        },
        recommendations: topStartups,
        summary: generateInvestorInsightsSummary(investor, topStartups, investorInvestments),
        analysisTimestamp: new Date()
      };
    }

    res.json({ success: true, insights });

  } catch (error) {
    console.error('AI Insights error:', error);
    res.status(500).json({ message: 'Failed to generate AI insights', error: error.message });
  }
});

// Helper functions for AI analysis
function calculateCompatibilityScore(startup, investor, investorInvestments) {
  let score = 0;
  
  // Sector alignment (40% weight)
  if (investor.investmentFocus && investor.investmentFocus.includes(startup.sector)) {
    score += 40;
  }
  
  // Stage preference (25% weight)
  const preferredStages = investorInvestments.map(inv => inv.startup.stage);
  if (preferredStages.includes(startup.stage)) {
    score += 25;
  }
  
  // Investment amount alignment (20% weight)
  const avgInvestment = investorInvestments.reduce((sum, inv) => sum + inv.amount, 0) / investorInvestments.length;
  const fundingGap = startup.funding.targetAmount - startup.funding.currentAmount;
  if (avgInvestment > 0 && Math.abs(avgInvestment - (fundingGap * 0.1)) < avgInvestment * 0.5) {
    score += 20;
  }
  
  // Activity level (15% weight)
  const recentInvestments = investorInvestments.filter(inv => 
    new Date(inv.createdAt) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
  );
  if (recentInvestments.length > 0) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

function calculateStartupCompatibilityScore(investor, startup, investorInvestments) {
  let score = 0;
  
  // Sector match (35% weight)
  if (investor.investmentFocus && investor.investmentFocus.includes(startup.sector)) {
    score += 35;
  }
  
  // Stage preference (25% weight)
  const preferredStages = investorInvestments.map(inv => inv.startup.stage);
  if (preferredStages.includes(startup.stage)) {
    score += 25;
  }
  
  // Funding progress (20% weight)
  const fundingProgress = (startup.funding.currentAmount / startup.funding.targetAmount) * 100;
  if (fundingProgress >= 20 && fundingProgress <= 80) {
    score += 20;
  }
  
  // Growth potential (20% weight)
  if (startup.metrics && startup.metrics.revenue > 0) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

function generateInvestorReasoning(startup, investor, investments) {
  const reasons = [];
  
  if (investor.investmentFocus && investor.investmentFocus.includes(startup.sector)) {
    reasons.push(`Strong sector alignment with ${startup.sector}`);
  }
  
  const avgInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0) / investments.length;
  if (avgInvestment > 0) {
    reasons.push(`Average investment of $${avgInvestment.toLocaleString()} matches funding needs`);
  }
  
  const sectorInvestments = investments.filter(inv => inv.startup.sector === startup.sector);
  if (sectorInvestments.length > 0) {
    reasons.push(`Has ${sectorInvestments.length} previous investments in ${startup.sector}`);
  }
  
  return reasons.slice(0, 3);
}

function generateStartupReasoning(investor, startup, investments) {
  const reasons = [];
  
  if (investor.investmentFocus && investor.investmentFocus.includes(startup.sector)) {
    reasons.push(`Matches your investment focus in ${startup.sector}`);
  }
  
  const fundingProgress = (startup.funding.currentAmount / startup.funding.targetAmount) * 100;
  if (fundingProgress > 20) {
    reasons.push(`${fundingProgress.toFixed(0)}% funded - showing market validation`);
  }
  
  if (startup.team && startup.team.length > 1) {
    reasons.push(`Strong team of ${startup.team.length} members`);
  }
  
  return reasons.slice(0, 3);
}

function generateStartupInsightsSummary(startup, topInvestors) {
  const avgCompatibility = topInvestors.reduce((sum, inv) => sum + inv.compatibilityScore, 0) / topInvestors.length;
  const topSectors = [...new Set(topInvestors.flatMap(inv => inv.investor.preferredSectors))];
  
  return {
    overview: `Found ${topInvestors.length} potential investors with ${avgCompatibility.toFixed(0)}% average compatibility`,
    keyFindings: [
      `Top investors focus on ${topSectors.slice(0, 3).join(', ')}`,
      `Average investment range: $${Math.min(...topInvestors.map(inv => inv.investor.averageInvestment)).toLocaleString()} - $${Math.max(...topInvestors.map(inv => inv.investor.averageInvestment)).toLocaleString()}`,
      `${topInvestors.filter(inv => inv.compatibilityScore > 70).length} highly compatible matches`
    ],
    recommendations: [
      'Focus on investors with recent activity in your sector',
      'Highlight unique value propositions to stand out',
      'Consider reaching out to top 3 matches first'
    ]
  };
}

function generateInvestorInsightsSummary(investor, topStartups, investments) {
  const avgCompatibility = topStartups.reduce((sum, startup) => sum + startup.compatibilityScore, 0) / topStartups.length;
  const sectors = [...new Set(topStartups.map(startup => startup.startup.sector))];
  
  return {
    overview: `Analyzed ${topStartups.length} startups with ${avgCompatibility.toFixed(0)}% average compatibility`,
    keyFindings: [
      `Opportunities across ${sectors.length} sectors: ${sectors.slice(0, 3).join(', ')}`,
      `${topStartups.filter(s => s.compatibilityScore > 75).length} high-potential matches`,
      `Average funding progress: ${(topStartups.reduce((sum, s) => sum + s.startup.fundingProgress.percentage, 0) / topStartups.length).toFixed(0)}%`
    ],
    recommendations: [
      'Diversify across high-scoring startups to reduce risk',
      'Consider early-stage opportunities for higher returns',
      'Review startup teams and traction metrics before investing'
    ]
  };
}

function assessStartupRisk(startup) {
  let riskLevel = 'Medium';
  const riskFactors = [];
  
  const fundingProgress = (startup.funding.currentAmount / startup.funding.targetAmount) * 100;
  
  if (fundingProgress < 20) {
    riskFactors.push('Low initial traction');
    riskLevel = 'High';
  }
  
  if (!startup.team || startup.team.length < 2) {
    riskFactors.push('Small team size');
  }
  
  if (startup.stage === 'idea') {
    riskFactors.push('Early stage venture');
    riskLevel = 'High';
  }
  
  if (riskFactors.length === 0) {
    riskLevel = 'Low';
  }
  
  return { level: riskLevel, factors: riskFactors };
}

function estimatePotentialReturns(startup) {
  // Simplified potential returns estimation
  const stage = startup.stage;
  const sector = startup.sector;
  
  let multiplier = 1;
  
  switch (stage) {
    case 'idea': multiplier = 10; break;
    case 'prototype': multiplier = 8; break;
    case 'mvp': multiplier = 6; break;
    case 'growth': multiplier = 4; break;
    case 'scaling': multiplier = 2; break;
    default: multiplier = 3;
  }
  
  // Sector adjustments
  if (['technology', 'biotech', 'fintech'].includes(sector.toLowerCase())) {
    multiplier *= 1.5;
  }
  
  return {
    estimatedMultiplier: `${multiplier}x`,
    timeframe: '3-7 years',
    confidence: 'Medium'
  };
}

module.exports = router;