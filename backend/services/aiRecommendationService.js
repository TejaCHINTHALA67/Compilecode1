const Startup = require('../models/Startup');
const User = require('../models/User');

class AIRecommendationService {
  constructor() {
    this.weights = {
      sector: 0.25,
      stage: 0.20,
      location: 0.15,
      fundingRange: 0.20,
      pastPerformance: 0.15,
      socialProof: 0.05
    };
  }

  // Main function to get AI-powered startup recommendations for investors
  async getStartupRecommendationsForInvestor(investorId, limit = 10) {
    try {
      const investor = await User.findById(investorId).populate('investorProfile.investmentHistory.startupId');
      if (!investor || !investor.investorProfile) {
        throw new Error('Investor profile not found');
      }

      // Get all active startups
      const startups = await Startup.find({
        status: 'active',
        moderationStatus: 'approved'
      }).populate('founder', 'firstName lastName entrepreneurProfile communityScore');

      // Calculate AI scores for each startup
      const scoredStartups = await Promise.all(
        startups.map(async (startup) => {
          const score = await this.calculateStartupScore(startup, investor);
          return {
            startup,
            aiScore: score,
            reasons: this.generateRecommendationReasons(startup, investor, score)
          };
        })
      );

      // Sort by AI score and return top recommendations
      return scoredStartups
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting startup recommendations:', error);
      throw error;
    }
  }

  // Get investor recommendations for startups
  async getInvestorRecommendationsForStartup(startupId, limit = 10) {
    try {
      const startup = await Startup.findById(startupId).populate('founder');
      if (!startup) {
        throw new Error('Startup not found');
      }

      // Get all active investors
      const investors = await User.find({
        userType: { $in: ['investor', 'both'] },
        status: 'active',
        kycStatus: 'verified'
      });

      // Calculate match scores for each investor
      const scoredInvestors = await Promise.all(
        investors.map(async (investor) => {
          const score = await this.calculateInvestorMatchScore(investor, startup);
          return {
            investor,
            matchScore: score,
            reasons: this.generateInvestorMatchReasons(investor, startup, score)
          };
        })
      );

      // Sort by match score and return top recommendations
      return scoredInvestors
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting investor recommendations:', error);
      throw error;
    }
  }

  // Calculate AI score for a startup based on investor preferences
  async calculateStartupScore(startup, investor) {
    let totalScore = 0;

    // 1. Sector Preference Score (25%)
    const sectorScore = this.calculateSectorScore(startup, investor);
    totalScore += sectorScore * this.weights.sector;

    // 2. Stage Preference Score (20%)
    const stageScore = this.calculateStageScore(startup, investor);
    totalScore += stageScore * this.weights.stage;

    // 3. Location Score (15%)
    const locationScore = this.calculateLocationScore(startup, investor);
    totalScore += locationScore * this.weights.location;

    // 4. Funding Range Score (20%)
    const fundingScore = this.calculateFundingScore(startup, investor);
    totalScore += fundingScore * this.weights.fundingRange;

    // 5. Past Performance Score (15%)
    const performanceScore = this.calculatePerformanceScore(startup);
    totalScore += performanceScore * this.weights.pastPerformance;

    // 6. Social Proof Score (5%)
    const socialScore = this.calculateSocialProofScore(startup);
    totalScore += socialScore * this.weights.socialProof;

    // Normalize to 0-100 scale
    return Math.min(Math.max(totalScore * 100, 0), 100);
  }

  // Calculate investor match score for a startup
  async calculateInvestorMatchScore(investor, startup) {
    let totalScore = 0;

    // 1. Sector Interest (30%)
    const sectorInterest = investor.investorProfile.preferredSectors.includes(startup.sector) ? 1 : 0.3;
    totalScore += sectorInterest * 0.30;

    // 2. Investment Capacity (25%)
    const capacityScore = this.calculateCapacityScore(investor, startup);
    totalScore += capacityScore * 0.25;

    // 3. Risk Tolerance (20%)
    const riskScore = this.calculateRiskScore(investor, startup);
    totalScore += riskScore * 0.20;

    // 4. Past Investment Pattern (15%)
    const patternScore = this.calculateInvestmentPatternScore(investor, startup);
    totalScore += patternScore * 0.15;

    // 5. Geographic Preference (10%)
    const geoScore = this.calculateGeographicScore(investor, startup);
    totalScore += geoScore * 0.10;

    return Math.min(Math.max(totalScore * 100, 0), 100);
  }

  // Individual scoring functions
  calculateSectorScore(startup, investor) {
    const preferredSectors = investor.investorProfile.preferredSectors || [];
    if (preferredSectors.includes(startup.sector)) {
      return 1.0;
    }
    
    // Check if investor has invested in similar sectors
    const pastSectors = investor.investorProfile.investmentHistory
      .map(inv => inv.startupId?.sector)
      .filter(Boolean);
    
    if (pastSectors.includes(startup.sector)) {
      return 0.8;
    }
    
    return 0.3;
  }

  calculateStageScore(startup, investor) {
    const stagePreferences = {
      'conservative': { 'growth': 1.0, 'expansion': 0.9, 'early-revenue': 0.7, 'mvp': 0.4, 'prototype': 0.2, 'idea': 0.1 },
      'moderate': { 'early-revenue': 1.0, 'mvp': 0.9, 'growth': 0.8, 'prototype': 0.6, 'expansion': 0.7, 'idea': 0.3 },
      'aggressive': { 'idea': 1.0, 'prototype': 0.9, 'mvp': 0.8, 'early-revenue': 0.6, 'growth': 0.4, 'expansion': 0.2 }
    };

    const riskTolerance = investor.investorProfile.riskTolerance || 'moderate';
    return stagePreferences[riskTolerance][startup.stage] || 0.5;
  }

  calculateLocationScore(startup, investor) {
    if (!investor.location || !startup.location) return 0.5;

    // Same country gets higher score
    if (investor.location.country === startup.location.country) {
      // Same city gets perfect score
      if (investor.location.city === startup.location.city) {
        return 1.0;
      }
      return 0.8;
    }

    // Different country but potentially interesting markets
    const globalMarkets = ['United States', 'India', 'Singapore', 'United Kingdom', 'Germany'];
    if (globalMarkets.includes(startup.location.country)) {
      return 0.6;
    }

    return 0.4;
  }

  calculateFundingScore(startup, investor) {
    const targetAmount = startup.funding.targetAmount;
    const investorCapacity = investor.investorProfile.investmentCapacity || 0;
    
    // Check if the startup's minimum investment is within investor's range
    const minInvestment = startup.funding.minimumInvestment || 100;
    
    if (minInvestment > investorCapacity) {
      return 0.1; // Too expensive for investor
    }

    // Ideal investment range (5-20% of capacity)
    const idealMin = investorCapacity * 0.05;
    const idealMax = investorCapacity * 0.20;

    if (minInvestment >= idealMin && minInvestment <= idealMax) {
      return 1.0;
    } else if (minInvestment < idealMin) {
      return 0.7; // Good but might be too small
    } else {
      return 0.5; // Manageable but on the higher side
    }
  }

  calculatePerformanceScore(startup) {
    let score = 0.5; // Base score

    // Founder experience
    const founderExp = startup.founder?.entrepreneurProfile?.experience;
    if (founderExp === 'serial') score += 0.3;
    else if (founderExp === 'experienced') score += 0.2;
    else if (founderExp === 'first-time') score += 0.1;

    // Team size and growth
    if (startup.metrics?.team?.size > 5) score += 0.1;
    if (startup.metrics?.team?.growth > 0) score += 0.1;

    // Revenue metrics
    if (startup.metrics?.revenue?.monthly > 0) score += 0.2;
    if (startup.metrics?.revenue?.growth > 20) score += 0.2;

    // User metrics
    if (startup.metrics?.users?.total > 1000) score += 0.1;
    if (startup.metrics?.users?.growth > 10) score += 0.1;

    return Math.min(score, 1.0);
  }

  calculateSocialProofScore(startup) {
    let score = 0;

    // Engagement metrics
    const engagement = startup.engagement;
    score += Math.min((engagement.likes || 0) / 100, 0.3);
    score += Math.min((engagement.views || 0) / 1000, 0.3);
    score += Math.min((engagement.bookmarks || 0) / 50, 0.2);

    // Existing investors
    score += Math.min((startup.funding.investorCount || 0) / 10, 0.2);

    return Math.min(score, 1.0);
  }

  calculateCapacityScore(investor, startup) {
    const capacity = investor.investorProfile.investmentCapacity || 0;
    const minInvestment = startup.funding.minimumInvestment || 100;

    if (capacity < minInvestment) return 0;
    if (capacity >= minInvestment * 10) return 1.0;
    
    return capacity / (minInvestment * 10);
  }

  calculateRiskScore(investor, startup) {
    const riskTolerance = investor.investorProfile.riskTolerance || 'moderate';
    const startupStage = startup.stage;

    const riskMatrix = {
      'conservative': { 'idea': 0.1, 'prototype': 0.3, 'mvp': 0.5, 'early-revenue': 0.8, 'growth': 1.0, 'expansion': 1.0 },
      'moderate': { 'idea': 0.3, 'prototype': 0.5, 'mvp': 0.7, 'early-revenue': 1.0, 'growth': 0.9, 'expansion': 0.8 },
      'aggressive': { 'idea': 1.0, 'prototype': 0.9, 'mvp': 0.8, 'early-revenue': 0.7, 'growth': 0.6, 'expansion': 0.5 }
    };

    return riskMatrix[riskTolerance][startupStage] || 0.5;
  }

  calculateInvestmentPatternScore(investor, startup) {
    const investmentHistory = investor.investorProfile.investmentHistory || [];
    
    if (investmentHistory.length === 0) return 0.5;

    // Check if investor has invested in similar funding ranges
    const avgInvestment = investmentHistory.reduce((sum, inv) => sum + (inv.amount || 0), 0) / investmentHistory.length;
    const startupMinInvestment = startup.funding.minimumInvestment || 100;

    const ratio = startupMinInvestment / avgInvestment;
    if (ratio >= 0.5 && ratio <= 2.0) return 1.0;
    if (ratio >= 0.2 && ratio <= 5.0) return 0.7;
    return 0.4;
  }

  calculateGeographicScore(investor, startup) {
    if (!investor.location || !startup.location) return 0.5;

    if (investor.location.country === startup.location.country) {
      return investor.location.city === startup.location.city ? 1.0 : 0.8;
    }

    // Time zone compatibility
    const timeZoneCompatible = this.checkTimeZoneCompatibility(investor.location.country, startup.location.country);
    return timeZoneCompatible ? 0.6 : 0.4;
  }

  checkTimeZoneCompatibility(country1, country2) {
    // Simplified time zone compatibility check
    const regions = {
      'Americas': ['United States', 'Canada', 'Brazil', 'Mexico'],
      'Europe': ['United Kingdom', 'Germany', 'France', 'Netherlands'],
      'Asia': ['India', 'Singapore', 'Japan', 'China'],
      'MENA': ['UAE', 'Saudi Arabia', 'Egypt', 'Israel']
    };

    for (const region of Object.values(regions)) {
      if (region.includes(country1) && region.includes(country2)) {
        return true;
      }
    }
    return false;
  }

  // Generate human-readable reasons for recommendations
  generateRecommendationReasons(startup, investor, score) {
    const reasons = [];
    const preferredSectors = investor.investorProfile.preferredSectors || [];

    if (preferredSectors.includes(startup.sector)) {
      reasons.push(`Matches your preferred ${startup.sector} sector`);
    }

    if (investor.investorProfile.riskTolerance === 'aggressive' && ['idea', 'prototype'].includes(startup.stage)) {
      reasons.push('Early-stage opportunity matching your risk appetite');
    }

    if (investor.location?.country === startup.location?.country) {
      reasons.push('Located in your region');
    }

    if (startup.engagement.likes > 50) {
      reasons.push('High community engagement');
    }

    if (startup.founder?.entrepreneurProfile?.experience === 'serial') {
      reasons.push('Serial entrepreneur with proven track record');
    }

    if (startup.metrics?.revenue?.monthly > 0) {
      reasons.push('Revenue-generating startup');
    }

    if (score > 80) {
      reasons.push('🔥 Top AI match score');
    } else if (score > 60) {
      reasons.push('✨ Strong AI match score');
    }

    return reasons.slice(0, 3); // Return top 3 reasons
  }

  generateInvestorMatchReasons(investor, startup, score) {
    const reasons = [];

    if (investor.investorProfile.preferredSectors.includes(startup.sector)) {
      reasons.push(`Actively invests in ${startup.sector}`);
    }

    if (investor.investorProfile.totalInvested > 10000) {
      reasons.push('Experienced investor with significant portfolio');
    }

    if (investor.location?.country === startup.location?.country) {
      reasons.push('Local investor who understands your market');
    }

    if (investor.communityScore > 50) {
      reasons.push('Active community member with high engagement');
    }

    if (score > 80) {
      reasons.push('🎯 Perfect match for your startup');
    }

    return reasons.slice(0, 3);
  }

  // Get trending sectors for recommendations
  async getTrendingSectors() {
    try {
      const trendingData = await Startup.aggregate([
        { $match: { status: 'active', moderationStatus: 'approved' } },
        {
          $group: {
            _id: '$sector',
            totalFunding: { $sum: '$funding.currentAmount' },
            startupCount: { $sum: 1 },
            avgEngagement: { $avg: '$engagement.views' }
          }
        },
        { $sort: { totalFunding: -1, avgEngagement: -1 } },
        { $limit: 5 }
      ]);

      return trendingData;
    } catch (error) {
      console.error('Error getting trending sectors:', error);
      return [];
    }
  }

  // Update AI scores for all startups (batch process)
  async updateAllStartupAIScores() {
    try {
      const startups = await Startup.find({ status: 'active' });
      
      for (const startup of startups) {
        const generalScore = await this.calculateGeneralStartupScore(startup);
        await startup.updateAIScore({
          market: generalScore.market,
          team: generalScore.team,
          product: generalScore.product,
          traction: generalScore.traction,
          financials: generalScore.financials
        });
      }

      console.log(`Updated AI scores for ${startups.length} startups`);
    } catch (error) {
      console.error('Error updating AI scores:', error);
    }
  }

  async calculateGeneralStartupScore(startup) {
    return {
      market: this.calculateMarketScore(startup),
      team: this.calculateTeamScore(startup),
      product: this.calculateProductScore(startup),
      traction: this.calculateTractionScore(startup),
      financials: this.calculateFinancialScore(startup)
    };
  }

  calculateMarketScore(startup) {
    let score = 50; // Base score

    // Market size indicators
    if (startup.metrics?.marketSize?.tam > 1000000000) score += 20; // >$1B TAM
    if (startup.metrics?.marketSize?.sam > 100000000) score += 15;  // >$100M SAM

    // Sector growth potential
    const growthSectors = ['AI', 'Health', 'Climate', 'FinTech'];
    if (growthSectors.includes(startup.sector)) score += 15;

    return Math.min(score, 100);
  }

  calculateTeamScore(startup) {
    let score = 40; // Base score

    // Founder experience
    const founderExp = startup.founder?.entrepreneurProfile?.experience;
    if (founderExp === 'serial') score += 30;
    else if (founderExp === 'experienced') score += 20;
    else score += 10;

    // Team size
    const teamSize = startup.metrics?.team?.size || 1;
    if (teamSize > 10) score += 20;
    else if (teamSize > 5) score += 15;
    else if (teamSize > 2) score += 10;

    // Community engagement
    if (startup.founder?.communityScore > 50) score += 10;

    return Math.min(score, 100);
  }

  calculateProductScore(startup) {
    let score = 30; // Base score

    // Development stage
    const stageScores = {
      'expansion': 30,
      'growth': 25,
      'early-revenue': 20,
      'mvp': 15,
      'prototype': 10,
      'idea': 5
    };
    score += stageScores[startup.stage] || 0;

    // Product metrics
    if (startup.metrics?.users?.total > 10000) score += 20;
    else if (startup.metrics?.users?.total > 1000) score += 15;
    else if (startup.metrics?.users?.total > 100) score += 10;

    // User growth
    if (startup.metrics?.users?.growth > 50) score += 15;
    else if (startup.metrics?.users?.growth > 20) score += 10;

    return Math.min(score, 100);
  }

  calculateTractionScore(startup) {
    let score = 20; // Base score

    // Social proof
    score += Math.min((startup.engagement.likes || 0) / 10, 20);
    score += Math.min((startup.engagement.views || 0) / 100, 20);

    // Investor interest
    score += Math.min((startup.funding.investorCount || 0) * 5, 25);

    // Funding progress
    const fundingProgress = (startup.funding.currentAmount || 0) / (startup.funding.targetAmount || 1);
    score += fundingProgress * 15;

    return Math.min(score, 100);
  }

  calculateFinancialScore(startup) {
    let score = 25; // Base score

    // Revenue
    const monthlyRevenue = startup.metrics?.revenue?.monthly || 0;
    if (monthlyRevenue > 100000) score += 35;
    else if (monthlyRevenue > 10000) score += 25;
    else if (monthlyRevenue > 1000) score += 15;
    else if (monthlyRevenue > 0) score += 10;

    // Revenue growth
    const revenueGrowth = startup.metrics?.revenue?.growth || 0;
    if (revenueGrowth > 100) score += 25;
    else if (revenueGrowth > 50) score += 20;
    else if (revenueGrowth > 20) score += 15;
    else if (revenueGrowth > 0) score += 10;

    // Funding efficiency
    const burnRate = (startup.funding.currentAmount || 0) / 12; // Assuming 12-month runway
    if (burnRate > 0 && monthlyRevenue / burnRate > 0.5) score += 15;

    return Math.min(score, 100);
  }
}

module.exports = new AIRecommendationService();