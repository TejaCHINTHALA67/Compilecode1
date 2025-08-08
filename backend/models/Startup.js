const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  tagline: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  logo: {
    type: String,
    default: null,
  },

  // Founder Information
  founder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coFounders: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: String,
      equityPercentage: Number,
    },
  ],

  // Business Details
  sector: {
    type: String,
    enum: [
      "AI",
      "Health",
      "Climate",
      "EdTech",
      "FinTech",
      "E-commerce",
      "Gaming",
      "Other",
    ],
    required: true,
  },
  subSector: String,
  businessModel: {
    type: String,
    enum: ["B2B", "B2C", "B2B2C", "Marketplace", "SaaS", "Hardware", "Other"],
    required: true,
  },
  stage: {
    type: String,
    enum: ["idea", "prototype", "mvp", "early-revenue", "growth", "expansion"],
    required: true,
  },

  // Location
  location: {
    city: {
      type: String,
      required: true,
    },
    state: String,
    country: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },

  // Pitch Content
  pitch: {
    video: {
      url: String,
      duration: Number, // in seconds
      thumbnail: String,
    },
    deck: {
      url: String,
      pages: Number,
    },
    documents: [
      {
        name: String,
        url: String,
        type: {
          type: String,
          enum: [
            "business_plan",
            "financial_model",
            "market_research",
            "prototype",
            "other",
          ],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },

  // Funding Information
  funding: {
    targetAmount: {
      type: Number,
      required: true,
      min: 1000,
    },
    currency: {
      type: String,
      default: "USD",
    },
    minimumInvestment: {
      type: Number,
      default: 100,
    },
    maximumInvestment: Number,
    currentAmount: {
      type: Number,
      default: 0,
    },
    investorCount: {
      type: Number,
      default: 0,
    },
    fundingDeadline: Date,
    equityOffered: Number, // percentage
    valuation: Number,
    useOfFunds: [
      {
        category: {
          type: String,
          enum: [
            "product_development",
            "marketing",
            "hiring",
            "operations",
            "legal",
            "other",
          ],
        },
        percentage: Number,
        amount: Number,
        description: String,
      },
    ],
  },

  // Investments
  investments: [
    {
      investor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      amount: Number,
      date: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "failed"],
        default: "pending",
      },
      transactionId: String,
    },
  ],

  // Business Metrics
  metrics: {
    revenue: {
      monthly: Number,
      annual: Number,
      growth: Number, // percentage
    },
    users: {
      total: Number,
      active: Number,
      growth: Number, // percentage
    },
    team: {
      size: Number,
      growth: Number,
    },
    marketSize: {
      tam: Number, // Total Addressable Market
      sam: Number, // Serviceable Addressable Market
      som: Number,  // Serviceable Obtainable Market
    }
  },

  // Social Engagement
  engagement: {
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    bookmarks: {
      type: Number,
      default: 0,
    },
  },

  // Community Interaction
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  bookmarkedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // Updates and Progress
  updates: [
    {
      title: String,
      content: String,
      images: [String],
      publishedAt: {
        type: Date,
        default: Date.now,
      },
      milestone: {
        type: String,
        enum: [
          "funding",
          "product",
          "team",
          "partnership",
          "customer",
          "other",
        ],
      },
    },
  ],

  // AI Scoring and Analytics
  aiScore: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    categories: {
      market: Number,
      team: Number,
      product: Number,
      traction: Number,
      financials: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },

  // Status and Moderation
  status: {
    type: String,
    enum: [
      "draft",
      "pending_review",
      "active",
      "funded",
      "paused",
      "rejected",
      "closed",
    ],
    default: "draft",
  },
  moderationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  moderationNotes: String,

  // Premium Features
  isPromoted: {
    type: Boolean,
    default: false,
  },
  promotionExpiry: Date,
  featuredUntil: Date,

  // External Links
  links: {
    website: String,
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    github: String,
    demo: String,
  },

  // SEO and Discovery
  tags: [String],
  keywords: [String],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  publishedAt: Date,
  fundingStartDate: Date,
  fundingEndDate: Date,
});

// Indexes for performance
startupSchema.index({ sector: 1, status: 1 });
startupSchema.index({ "location.city": 1, "location.country": 1 });
startupSchema.index({ founder: 1 });
startupSchema.index({ status: 1, moderationStatus: 1 });
startupSchema.index({ "funding.targetAmount": 1 });
startupSchema.index({ "engagement.views": -1 });
startupSchema.index({ "aiScore.overall": -1 });
startupSchema.index({ createdAt: -1 });
startupSchema.index({ publishedAt: -1 });

// Text search index
startupSchema.index({
  name: "text",
  tagline: "text",
  description: "text",
  tags: "text",
});

// Virtual for funding progress percentage
startupSchema.virtual("fundingProgress").get(function () {
  return Math.min(
    (this.funding.currentAmount / this.funding.targetAmount) * 100,
    100
  );
});

// Virtual for days remaining
startupSchema.virtual("daysRemaining").get(function () {
  if (!this.funding.fundingDeadline) {return null;}
  const now = new Date();
  const deadline = new Date(this.funding.fundingDeadline);
  const diffTime = deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
startupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Auto-calculate funding progress
  if (
    this.funding.currentAmount >= this.funding.targetAmount &&
    this.status === "active"
  ) {
    this.status = "funded";
    this.fundingEndDate = new Date();
  }

  next();
});

// Instance methods
startupSchema.methods.addInvestment = function (
  investorId,
  amount,
  transactionId
) {
  this.investments.push({
    investor: investorId,
    amount: amount,
    transactionId: transactionId,
    status: "confirmed",
  });

  this.funding.currentAmount += amount;
  this.funding.investorCount += 1;

  return this.save();
};

startupSchema.methods.addView = function () {
  this.engagement.views += 1;
  return this.save();
};

startupSchema.methods.toggleLike = function (userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.engagement.likes -= 1;
  } else {
    this.likedBy.push(userId);
    this.engagement.likes += 1;
  }
  return this.save();
};

startupSchema.methods.toggleBookmark = function (userId) {
  const index = this.bookmarkedBy.indexOf(userId);
  if (index > -1) {
    this.bookmarkedBy.splice(index, 1);
    this.engagement.bookmarks -= 1;
  } else {
    this.bookmarkedBy.push(userId);
    this.engagement.bookmarks += 1;
  }
  return this.save();
};

startupSchema.methods.addUpdate = function (updateData) {
  this.updates.unshift(updateData);
  return this.save();
};

startupSchema.methods.updateAIScore = function (scores) {
  this.aiScore.categories = scores;
  this.aiScore.overall =
    Object.values(scores).reduce((a, b) => a + b, 0) /
    Object.keys(scores).length;
  this.aiScore.lastUpdated = new Date();
  return this.save();
};

// Static methods
startupSchema.statics.findByFounder = function (founderId) {
  return this.find({ founder: founderId });
};

startupSchema.statics.findBySector = function (sector, limit = 20) {
  return this.find({
    sector: sector,
    status: "active",
    moderationStatus: "approved",
  })
    .sort({ "engagement.views": -1 })
    .limit(limit)
    .populate("founder", "firstName lastName profilePicture");
};

startupSchema.statics.getFeatured = function (limit = 10) {
  return this.find({
    status: "active",
    moderationStatus: "approved",
    $or: [{ isPromoted: true }, { featuredUntil: { $gte: new Date() } }],
  })
    .sort({ "aiScore.overall": -1 })
    .limit(limit)
    .populate("founder", "firstName lastName profilePicture");
};

startupSchema.statics.getTrending = function (limit = 20) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.find({
    status: "active",
    moderationStatus: "approved",
    publishedAt: { $gte: oneWeekAgo },
  })
    .sort({ "engagement.views": -1, "engagement.likes": -1 })
    .limit(limit)
    .populate("founder", "firstName lastName profilePicture");
};

startupSchema.statics.searchStartups = function (query, filters = {}) {
  const searchQuery = {
    status: "active",
    moderationStatus: "approved",
    ...filters,
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .sort(
      query ? { score: { $meta: "textScore" } } : { "engagement.views": -1 }
    )
    .populate("founder", "firstName lastName profilePicture");
};

module.exports = mongoose.model("Startup", startupSchema);
