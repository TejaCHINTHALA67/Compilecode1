const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Startup = require('../models/Startup');
const User = require('../models/User');
const { auth, optionalAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary (for file uploads)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Get all startups with filters and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sector,
      stage,
      location,
      search,
      sortBy = 'trending',
      minFunding,
      maxFunding
    } = req.query;

    const filters = {
      status: 'active',
      moderationStatus: 'approved'
    };

    // Apply filters
    if (sector) filters.sector = sector;
    if (stage) filters.stage = stage;
    if (location) {
      filters.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') }
      ];
    }
    if (minFunding || maxFunding) {
      filters['funding.targetAmount'] = {};
      if (minFunding) filters['funding.targetAmount'].$gte = Number(minFunding);
      if (maxFunding) filters['funding.targetAmount'].$lte = Number(maxFunding);
    }

    // Build query
    let query = Startup.find(filters);

    // Apply search
    if (search) {
      query = Startup.searchStartups(search, filters);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.sort({ publishedAt: -1 });
        break;
      case 'trending':
        query = query.sort({ 'engagement.views': -1, 'engagement.likes': -1 });
        break;
      case 'funding_progress':
        query = query.sort({ 'funding.currentAmount': -1 });
        break;
      case 'ai_score':
        query = query.sort({ 'aiScore.overall': -1 });
        break;
      default:
        query = query.sort({ 'engagement.views': -1 });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    query = query
      .skip(skip)
      .limit(Number(limit))
      .populate('founder', 'firstName lastName profilePicture communityScore')
      .populate('coFounders.user', 'firstName lastName profilePicture');

    const startups = await query;

    // Get total count for pagination
    const totalCount = await Startup.countDocuments(filters);

    // Add user interaction data if authenticated
    const startupsWithUserData = startups.map(startup => {
      const startupObj = startup.toObject({ virtuals: true });
      
      if (req.user) {
        startupObj.isLiked = startup.likedBy.includes(req.user.userId);
        startupObj.isBookmarked = startup.bookmarkedBy.includes(req.user.userId);
      }
      
      return startupObj;
    });

    res.json({
      success: true,
      data: {
        startups: startupsWithUserData,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: skip + startups.length < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startups',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get featured startups
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const startups = await Startup.getFeatured(Number(limit));
    
    const startupsWithUserData = startups.map(startup => {
      const startupObj = startup.toObject({ virtuals: true });
      
      if (req.user) {
        startupObj.isLiked = startup.likedBy.includes(req.user.userId);
        startupObj.isBookmarked = startup.bookmarkedBy.includes(req.user.userId);
      }
      
      return startupObj;
    });

    res.json({
      success: true,
      data: startupsWithUserData
    });

  } catch (error) {
    console.error('Get featured startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured startups',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get trending startups
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const startups = await Startup.getTrending(Number(limit));
    
    const startupsWithUserData = startups.map(startup => {
      const startupObj = startup.toObject({ virtuals: true });
      
      if (req.user) {
        startupObj.isLiked = startup.likedBy.includes(req.user.userId);
        startupObj.isBookmarked = startup.bookmarkedBy.includes(req.user.userId);
      }
      
      return startupObj;
    });

    res.json({
      success: true,
      data: startupsWithUserData
    });

  } catch (error) {
    console.error('Get trending startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending startups',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get startup by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('founder', 'firstName lastName profilePicture bio entrepreneurProfile communityScore')
      .populate('coFounders.user', 'firstName lastName profilePicture')
      .populate('investments.investor', 'firstName lastName profilePicture');

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    // Increment view count
    await startup.addView();

    const startupObj = startup.toObject({ virtuals: true });
    
    if (req.user) {
      startupObj.isLiked = startup.likedBy.includes(req.user.userId);
      startupObj.isBookmarked = startup.bookmarkedBy.includes(req.user.userId);
    }

    res.json({
      success: true,
      data: startupObj
    });

  } catch (error) {
    console.error('Get startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new startup
router.post('/', auth, requireRole(['entrepreneur']), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('tagline').trim().isLength({ min: 10, max: 200 }).withMessage('Tagline must be between 10 and 200 characters'),
  body('description').trim().isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters'),
  body('sector').isIn(['AI', 'Health', 'Climate', 'EdTech', 'FinTech', 'E-commerce', 'Gaming', 'Other']).withMessage('Invalid sector'),
  body('businessModel').isIn(['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'Hardware', 'Other']).withMessage('Invalid business model'),
  body('stage').isIn(['idea', 'prototype', 'mvp', 'early-revenue', 'growth', 'expansion']).withMessage('Invalid stage'),
  body('funding.targetAmount').isFloat({ min: 1000 }).withMessage('Target amount must be at least 1000'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.country').trim().notEmpty().withMessage('Country is required')
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

    const startupData = {
      ...req.body,
      founder: req.user.userId,
      status: 'draft',
      moderationStatus: 'pending'
    };

    const startup = new Startup(startupData);
    await startup.save();

    const populatedStartup = await Startup.findById(startup._id)
      .populate('founder', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Startup created successfully',
      data: populatedStartup.toObject({ virtuals: true })
    });

  } catch (error) {
    console.error('Create startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create startup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update startup
router.put('/:id', auth, requireRole(['entrepreneur']), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('tagline').optional().trim().isLength({ min: 10, max: 200 }).withMessage('Tagline must be between 10 and 200 characters'),
  body('description').optional().trim().isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters')
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

    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    // Check if user is the founder
    if (startup.founder.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the founder can update this startup.'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'tagline', 'description', 'logo', 'sector', 'subSector',
      'businessModel', 'stage', 'location', 'pitch', 'funding',
      'metrics', 'links', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        startup[field] = req.body[field];
      }
    });

    await startup.save();

    const populatedStartup = await Startup.findById(startup._id)
      .populate('founder', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Startup updated successfully',
      data: populatedStartup.toObject({ virtuals: true })
    });

  } catch (error) {
    console.error('Update startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update startup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload startup media (logo, pitch video, documents)
router.post('/:id/upload', auth, requireRole(['entrepreneur']), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'pitchVideo', maxCount: 1 },
  { name: 'pitchDeck', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    // Check if user is the founder
    if (startup.founder.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the founder can upload files.'
      });
    }

    const uploadedFiles = {};

    // Upload logo
    if (req.files.logo) {
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'startuplink/logos',
          transformation: [
            { width: 300, height: 300, crop: 'fit' }
          ]
        },
        (error, result) => {
          if (error) throw error;
          return result;
        }
      );
      
      req.files.logo[0].stream.pipe(result);
      startup.logo = result.secure_url;
      uploadedFiles.logo = result.secure_url;
    }

    // Upload pitch video
    if (req.files.pitchVideo) {
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'startuplink/videos'
        },
        (error, result) => {
          if (error) throw error;
          return result;
        }
      );
      
      req.files.pitchVideo[0].stream.pipe(result);
      startup.pitch.video = {
        url: result.secure_url,
        duration: result.duration,
        thumbnail: result.secure_url.replace(/\.[^/.]+$/, ".jpg")
      };
      uploadedFiles.pitchVideo = startup.pitch.video;
    }

    // Upload documents
    if (req.files.documents) {
      for (const file of req.files.documents) {
        const result = await cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'startuplink/documents'
          },
          (error, result) => {
            if (error) throw error;
            return result;
          }
        );
        
        file.stream.pipe(result);
        
        startup.pitch.documents.push({
          name: file.originalname,
          url: result.secure_url,
          type: req.body.documentType || 'other'
        });
      }
    }

    await startup.save();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        uploadedFiles,
        startup: startup.toObject({ virtuals: true })
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Like/Unlike startup
router.post('/:id/like', auth, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    await startup.toggleLike(req.user.userId);

    res.json({
      success: true,
      message: 'Like status updated',
      data: {
        likes: startup.engagement.likes,
        isLiked: startup.likedBy.includes(req.user.userId)
      }
    });

  } catch (error) {
    console.error('Like startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update like status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Bookmark/Unbookmark startup
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    await startup.toggleBookmark(req.user.userId);

    res.json({
      success: true,
      message: 'Bookmark status updated',
      data: {
        bookmarks: startup.engagement.bookmarks,
        isBookmarked: startup.bookmarkedBy.includes(req.user.userId)
      }
    });

  } catch (error) {
    console.error('Bookmark startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bookmark status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add startup update
router.post('/:id/updates', auth, requireRole(['entrepreneur']), [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('content').trim().isLength({ min: 20, max: 1000 }).withMessage('Content must be between 20 and 1000 characters'),
  body('milestone').optional().isIn(['funding', 'product', 'team', 'partnership', 'customer', 'other']).withMessage('Invalid milestone type')
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

    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    // Check if user is the founder
    if (startup.founder.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the founder can add updates.'
      });
    }

    const updateData = {
      title: req.body.title,
      content: req.body.content,
      milestone: req.body.milestone || 'other',
      images: req.body.images || []
    };

    await startup.addUpdate(updateData);

    // Notify investors via socket.io
    const io = req.app.get('io');
    io.to(`startup_${startup._id}`).emit('startup_update', {
      startupId: startup._id,
      startupName: startup.name,
      update: updateData
    });

    res.json({
      success: true,
      message: 'Update added successfully',
      data: updateData
    });

  } catch (error) {
    console.error('Add update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add update',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's startups (as founder)
router.get('/user/my-startups', auth, requireRole(['entrepreneur']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const startups = await Startup.find({ founder: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('founder', 'firstName lastName profilePicture');

    const totalCount = await Startup.countDocuments({ founder: req.user.userId });

    res.json({
      success: true,
      data: {
        startups: startups.map(s => s.toObject({ virtuals: true })),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: skip + startups.length < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get my startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your startups',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;