const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  // Investment identification
  investmentId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // Relationships
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  
  // Investment details
  amount: {
    type: Number,
    required: true,
    min: [100, 'Minimum investment amount is $100']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },
  investmentType: {
    type: String,
    enum: ['equity', 'convertible_note', 'revenue_share', 'donation'],
    default: 'equity'
  },
  
  // Investment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'plaid', 'bank_transfer', 'crypto'],
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  transactionFee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  
  // Investment terms
  equityPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  expectedReturn: {
    type: Number,
    min: 0
  },
  maturityDate: {
    type: Date
  },
  
  // Timeline
  investmentDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  
  // Additional information
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // Due diligence
  dueDiligenceCompleted: {
    type: Boolean,
    default: false
  },
  riskAssessment: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium'
    },
    factors: [String]
  },
  
  // Communication
  updates: [{
    date: {
      type: Date,
      default: Date.now
    },
    title: String,
    message: String,
    type: {
      type: String,
      enum: ['milestone', 'financial', 'product', 'team', 'other'],
      default: 'other'
    }
  }],
  
  // Legal compliance
  accreditedInvestor: {
    type: Boolean,
    default: false
  },
  kycVerified: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    required: true
  },
  termsVersion: {
    type: String,
    required: true
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['mobile_app', 'web_app', 'api'],
    default: 'mobile_app'
  },
  deviceInfo: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
investmentSchema.index({ investor: 1, investmentDate: -1 });
investmentSchema.index({ startup: 1, investmentDate: -1 });
investmentSchema.index({ status: 1, investmentDate: -1 });
investmentSchema.index({ investmentId: 1 });
investmentSchema.index({ paymentId: 1 });

// Virtual for ROI calculation
investmentSchema.virtual('roi').get(function() {
  if (this.expectedReturn && this.amount) {
    return ((this.expectedReturn - this.amount) / this.amount) * 100;
  }
  return 0;
});

// Virtual for investment duration
investmentSchema.virtual('duration').get(function() {
  if (this.completedDate && this.investmentDate) {
    return Math.ceil((this.completedDate - this.investmentDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware
investmentSchema.pre('save', function(next) {
  // Calculate net amount if not provided
  if (!this.netAmount) {
    this.netAmount = this.amount - (this.transactionFee || 0);
  }
  
  // Set processed date when status changes to processing
  if (this.isModified('status') && this.status === 'processing' && !this.processedDate) {
    this.processedDate = new Date();
  }
  
  // Set completed date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  next();
});

// Static methods
investmentSchema.statics.getTotalInvestmentByStartup = function(startupId) {
  return this.aggregate([
    { $match: { startup: startupId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
};

investmentSchema.statics.getInvestorPortfolio = function(investorId) {
  return this.find({ investor: investorId })
    .populate('startup', 'name description logo sector stage')
    .sort({ investmentDate: -1 });
};

investmentSchema.statics.getInvestmentAnalytics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        investmentDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$investmentDate' },
          month: { $month: '$investmentDate' }
        },
        totalAmount: { $sum: '$amount' },
        totalInvestments: { $sum: 1 },
        avgInvestment: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

// Instance methods
investmentSchema.methods.addUpdate = function(title, message, type = 'other') {
  this.updates.push({
    title,
    message,
    type,
    date: new Date()
  });
  return this.save();
};

investmentSchema.methods.calculateExpectedROI = function() {
  if (this.expectedReturn && this.amount) {
    return ((this.expectedReturn - this.amount) / this.amount) * 100;
  }
  return 0;
};

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;