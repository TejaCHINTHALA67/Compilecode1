const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
  // Unique ID for OTP login
  uniqueId: {
    type: String,
    unique: true,
    required: true,
    default: () =>
      `SL${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
  },

  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },

  // Business/Startup Info
  businessName: {
    type: String,
    trim: true,
  },
  businessType: {
    type: String,
    enum: ["startup", "business", "investor"],
    required: true,
  },

  // User Type and Role
  userType: {
    type: String,
    enum: ["entrepreneur", "investor", "both"],
    required: true,
  },

  // Profile Info
  profilePicture: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },

  // KYC and Verification
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  kycStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  kycDocuments: [
    {
      type: {
        type: String,
        enum: [
          "business_registration",
          "pitch_deck",
          "proof_of_funds",
          "intent_letter",
          "passport",
          "driving_license",
          "national_id",
          "utility_bill",
        ],
      },
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  ],

  // OTP System
  otp: {
    code: String,
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0,
    },
  },

  // Investor-specific fields
  investorProfile: {
    bankAccountLinked: {
      type: Boolean,
      default: false,
    },
    investmentCapacity: {
      type: Number,
      default: 0,
    },
    riskTolerance: {
      type: String,
      enum: ["conservative", "moderate", "aggressive"],
      default: "moderate",
    },
    preferredSectors: [
      {
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
      },
    ],
    totalInvested: {
      type: Number,
      default: 0,
    },
    portfolioValue: {
      type: Number,
      default: 0,
    },
    totalReturns: {
      type: Number,
      default: 0,
    },
    investmentHistory: [
      {
        startupId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Startup",
        },
        amount: Number,
        date: {
          type: Date,
          default: Date.now,
        },
        currentValue: Number,
        status: {
          type: String,
          enum: ["active", "exited", "failed"],
          default: "active",
        },
      },
    ],
  },

  // Entrepreneur-specific fields
  entrepreneurProfile: {
    experience: {
      type: String,
      enum: ["first-time", "experienced", "serial"],
      default: "first-time",
    },
    education: {
      degree: String,
      institution: String,
      graduationYear: Number,
    },
    previousStartups: [
      {
        name: String,
        role: String,
        yearFounded: Number,
        outcome: {
          type: String,
          enum: ["ongoing", "acquired", "ipo", "failed", "pivoted"],
        },
      },
    ],
    skills: [String],
    linkedInProfile: String,
    githubProfile: String,
    personalWebsite: String,
  },

  // Social and Community
  socialLinks: {
    linkedin: String,
    twitter: String,
    instagram: String,
    website: String,
  },
  communityScore: {
    type: Number,
    default: 0,
  },
  contributions: {
    mentoring: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: Number,
      default: 0,
    },
    productTesting: {
      type: Number,
      default: 0,
    },
  },

  // Subscriptions and Premium
  subscriptionType: {
    type: String,
    enum: ["free", "premium", "pro"],
    default: "free",
  },
  subscriptionExpiry: Date,

  // Security and Privacy
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  lastLogin: Date,
  loginHistory: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ip: String,
      userAgent: String,
      location: String,
    },
  ],

  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true,
      },
      investmentHistoryVisible: {
        type: Boolean,
        default: false,
      },
    },
    language: {
      type: String,
      default: "en",
    },
    currency: {
      type: String,
      default: "USD",
    },
  },

  // Status and Timestamps
  status: {
    type: String,
    enum: ["active", "suspended", "deactivated"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ uniqueId: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ "location.city": 1, "location.country": 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ createdAt: -1 });

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {return next();}

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0,
  };
  return otp;
};

userSchema.methods.verifyOTP = function (otpCode) {
  if (!this.otp || !this.otp.code) {
    return false;
  }

  if (this.otp.attempts >= 3) {
    return false;
  }

  if (new Date() > this.otp.expiresAt) {
    return false;
  }

  if (this.otp.code === otpCode) {
    this.otp = null; // Clear OTP after successful verification
    return true;
  }

  this.otp.attempts += 1;
  return false;
};

userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.kycDocuments;
  delete user.loginHistory;
  if (!user.preferences.privacy.investmentHistoryVisible) {
    delete user.investorProfile.investmentHistory;
  }
  return user;
};

userSchema.methods.updateCommunityScore = function () {
  const { mentoring, feedback, productTesting } = this.contributions;
  this.communityScore = mentoring * 10 + feedback * 5 + productTesting * 3;
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUniqueId = function (uniqueId) {
  return this.findOne({ uniqueId: uniqueId.toUpperCase() });
};

userSchema.statics.getTopInvestors = function (limit = 10) {
  return this.find({ userType: { $in: ["investor", "both"] } })
    .sort({ "investorProfile.totalInvested": -1 })
    .limit(limit)
    .select(
      "firstName lastName profilePicture investorProfile.totalInvested communityScore"
    );
};

userSchema.statics.getTopEntrepreneurs = function (limit = 10) {
  return this.find({ userType: { $in: ["entrepreneur", "both"] } })
    .sort({ communityScore: -1 })
    .limit(limit)
    .select(
      "firstName lastName profilePicture entrepreneurProfile communityScore"
    );
};

module.exports = mongoose.model("User", userSchema);
