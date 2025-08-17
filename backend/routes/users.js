const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { isAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object')
];

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', validateProfileUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { name, phone, address, preferences } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

  const user = await User.findByPk(req.user.id);
  await user.update(updateData);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   POST /api/users/profile/avatar
// @desc    Upload profile image
// @access  Private
router.post('/profile/avatar', upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file'
    });
  }

  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bbsr-grocery/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // Update user profile
    const user = await User.findByPk(req.user.id);
    await user.update({ profileImage: result.secure_url });

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: result.secure_url
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
}));

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);
  
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
}));

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', isAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (role) whereClause.role = role;
  if (search) {
    whereClause[require('sequelize').Op.or] = [
      { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { phone: { [require('sequelize').Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      users: users.map(user => user.getPublicProfile()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', isAdmin, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user by ID (Admin only)
// @access  Private/Admin
router.put('/:id', isAdmin, [
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['customer', 'store_owner', 'delivery_partner', 'admin'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const { isActive, role } = req.body;
  const updateData = {};

  if (isActive !== undefined) updateData.isActive = isActive;
  if (role) updateData.role = role;

  await user.update(updateData);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', isAdmin, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Soft delete - just deactivate the user
  await user.update({ isActive: false });

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// @route   GET /api/users/delivery-partners
// @desc    Get available delivery partners
// @access  Private
router.get('/delivery-partners', asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;

  const whereClause = {
    role: 'delivery_partner',
    isActive: true
  };

  const deliveryPartners = await User.findAll({
    where: whereClause,
    attributes: ['id', 'name', 'phone', 'address', 'lastLogin'],
    order: [['lastLogin', 'DESC']]
  });

  // Filter by distance if coordinates provided
  let filteredPartners = deliveryPartners;
  if (lat && lng) {
    const { getDistance } = require('geolib');
    filteredPartners = deliveryPartners.filter(partner => {
      if (!partner.address || !partner.address.coordinates) return false;
      
      const distance = getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { 
          latitude: partner.address.coordinates.lat, 
          longitude: partner.address.coordinates.lng 
        }
      );
      
      return distance <= radius * 1000; // Convert km to meters
    });
  }

  res.json({
    success: true,
    data: {
      deliveryPartners: filteredPartners
    }
  });
}));

module.exports = router;
