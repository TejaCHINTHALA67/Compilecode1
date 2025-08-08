const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const documentService = require('../services/documentService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d'
  });
};

// Register endpoint with enhanced features
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
  body('phoneNumber').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
  body('userType').isIn(['entrepreneur', 'investor', 'both']).withMessage('User type must be entrepreneur, investor, or both'),
  body('businessType').isIn(['startup', 'business', 'investor']).withMessage('Business type is required'),
  body('businessName').optional().trim().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters')
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
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      userType,
      businessType,
      businessName,
      location
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check age requirement (18+)
    const birthDate = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 18 years old to register'
      });
    }

    // Create new user with unique ID
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth: birthDate,
      userType,
      businessType,
      businessName,
      location: location || {}
    });

    // Initialize user type specific profiles
    if (userType === 'investor' || userType === 'both') {
      user.investorProfile = {
        bankAccountLinked: false,
        investmentCapacity: 0,
        riskTolerance: 'moderate',
        preferredSectors: [],
        totalInvested: 0,
        portfolioValue: 0,
        totalReturns: 0,
        investmentHistory: []
      };
    }

    if (userType === 'entrepreneur' || userType === 'both') {
      user.entrepreneurProfile = {
        experience: 'first-time',
        education: {},
        previousStartups: [],
        skills: []
      };
    }

    await user.save();

    // Send welcome email with account details
    try {
      await emailService.sendAccountConfirmation(email, {
        firstName,
        lastName,
        email,
        uniqueId: user.uniqueId,
        userType,
        businessName
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    const userData = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Check your email for account details.',
      data: {
        user: userData,
        token,
        requiredDocuments: documentService.getRequiredDocuments(userType)
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// OTP-based login endpoint
router.post('/login-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('uniqueId').notEmpty().withMessage('Unique ID is required')
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

    const { email, uniqueId } = req.body;

    // Find user by email and unique ID
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      uniqueId: uniqueId.toUpperCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or Unique ID'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is suspended or deactivated'
      });
    }

    // Generate and send OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
      await emailService.sendOTP(email, otp, user.firstName);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        email: user.email,
        uniqueId: user.uniqueId
      }
    });

  } catch (error) {
    console.error('OTP login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('uniqueId').notEmpty().withMessage('Unique ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { email, uniqueId, otp } = req.body;

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      uniqueId: uniqueId.toUpperCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or Unique ID'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);
    if (!isValidOTP) {
      await user.save(); // Save attempt count
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    await user.save();

    // Update last login
    user.lastLogin = new Date();
    user.loginHistory.unshift({
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(0, 10);
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    const userData = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Traditional password-based login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is suspended or deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginHistory.unshift({
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(0, 10);
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    const userData = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Document upload endpoint
// TEMPORARILY DISABLED FOR TESTING
// router.post('/upload-documents', auth, documentService.getUploadMiddleware().array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents uploaded'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Process uploaded documents
    const uploadedDocs = await documentService.processUploadedDocuments(
      req.files,
      user._id,
      user.userType
    );

    // Add documents to user
    user.kycDocuments.push(...uploadedDocs);
    await user.save();

    // Send confirmation emails for each document
    for (const doc of uploadedDocs) {
      try {
        await emailService.sendDocumentUploadConfirmation(
          user.email,
          user.firstName,
          doc.name
        );
      } catch (emailError) {
        console.error('Error sending document confirmation email:', emailError);
      }
    }

    // Get document status summary
    const docSummary = documentService.getDocumentStatusSummary(
      user.kycDocuments,
      user.userType
    );

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documents: uploadedDocs,
        summary: docSummary,
        isComplete: documentService.isDocumentationComplete(
          user.kycDocuments,
          user.userType
        )
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Document upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get required documents for user type
router.get('/required-documents/:userType', (req, res) => {
  try {
    const { userType } = req.params;
    const requiredDocs = documentService.getRequiredDocuments(userType);
    
    res.json({
      success: true,
      data: {
        documents: requiredDocs,
        uploadFields: documentService.generateUploadFields(userType)
      }
    });
  } catch (error) {
    console.error('Get required documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get required documents',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get document status summary
    const docSummary = documentService.getDocumentStatusSummary(
      user.kycDocuments,
      user.userType
    );

    const userData = user.getPublicProfile();
    userData.documentSummary = docSummary;

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Please provide a valid phone number')
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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'phoneNumber', 'location',
      'socialLinks', 'preferences', 'entrepreneurProfile', 'investorProfile'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'entrepreneurProfile' || field === 'investorProfile') {
          // Merge profile updates
          user[field] = { ...user[field], ...req.body[field] };
        } else {
          user[field] = req.body[field];
        }
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify email endpoint (placeholder for email verification)
router.post('/verify-email', auth, async (req, res) => {
  try {
    const { verificationCode } = req.body;

    // In a real implementation, you would:
    // 1. Send verification email with code during registration
    // 2. Store code in database or cache
    // 3. Verify code here

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For MVP, mark as verified (implement proper verification later)
    user.isEmailVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Logout endpoint (mainly for cleanup, JWT is stateless)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;