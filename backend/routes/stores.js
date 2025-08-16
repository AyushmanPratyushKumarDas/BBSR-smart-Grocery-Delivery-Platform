const express = require('express');
const { body, validationResult } = require('express-validator');
const { Store, User, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { isStoreOwner, isAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { getDistance } = require('geolib');

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
const validateStore = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('address')
    .isObject()
    .withMessage('Address must be an object'),
  body('coordinates')
    .isObject()
    .withMessage('Coordinates must be an object'),
  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('category')
    .optional()
    .isIn(['grocery', 'supermarket', 'convenience', 'specialty'])
    .withMessage('Invalid store category'),
  body('deliveryRadius')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Delivery radius must be between 1 and 50 km'),
  body('minimumOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount cannot be negative'),
  body('deliveryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Delivery fee cannot be negative')
];

// @route   GET /api/stores
// @desc    Get all stores with filters
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    search, 
    lat, 
    lng, 
    radius = 10,
    isOpen,
    minRating,
    sortBy = 'rating',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { isActive: true };

  // Apply filters
  if (category) whereClause.category = category;
  if (search) {
    whereClause[require('sequelize').Op.or] = [
      { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { description: { [require('sequelize').Op.iLike]: `%${search}%` } }
    ];
  }
  if (minRating) whereClause.rating = { [require('sequelize').Op.gte]: parseFloat(minRating) };

  // Get stores
  const { count, rows: stores } = await Store.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'phone']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]]
  });

  // Filter by distance and open status
  let filteredStores = stores;
  if (lat && lng) {
    filteredStores = stores.filter(store => {
      const distance = getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { 
          latitude: store.coordinates.lat, 
          longitude: store.coordinates.lng 
        }
      );
      
      const isWithinRadius = distance <= radius * 1000; // Convert km to meters
      const isCurrentlyOpen = isOpen === 'true' ? store.isOpenNow() : true;
      
      return isWithinRadius && isCurrentlyOpen;
    });
  }

  res.json({
    success: true,
    data: {
      stores: filteredStores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredStores.length,
        pages: Math.ceil(filteredStores.length / limit)
      }
    }
  });
}));

// @route   GET /api/stores/nearby
// @desc    Get nearby stores
// @access  Public
router.get('/nearby', asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5, limit = 10 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const stores = await Store.findAll({
    where: { isActive: true },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'phone']
      }
    ],
    limit: parseInt(limit)
  });

  // Calculate distances and filter
  const storesWithDistance = stores
    .map(store => {
      const distance = getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { 
          latitude: store.coordinates.lat, 
          longitude: store.coordinates.lng 
        }
      );
      
      return {
        ...store.toJSON(),
        distance: distance / 1000, // Convert to km
        isOpen: store.isOpenNow()
      };
    })
    .filter(store => store.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    data: {
      stores: storesWithDistance
    }
  });
}));

// @route   GET /api/stores/:id
// @desc    Get store by ID
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const store = await Store.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'phone', 'email']
      },
      {
        model: Product,
        as: 'products',
        where: { isAvailable: true },
        required: false,
        limit: 20
      }
    ]
  });

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  res.json({
    success: true,
    data: {
      store: {
        ...store.toJSON(),
        isOpen: store.isOpenNow()
      }
    }
  });
}));

// @route   POST /api/stores
// @desc    Create a new store
// @access  Private/Store Owner
router.post('/', isStoreOwner, validateStore, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const storeData = {
    ...req.body,
    ownerId: req.user.id
  };

  const store = await Store.create(storeData);

  res.status(201).json({
    success: true,
    message: 'Store created successfully',
    data: {
      store
    }
  });
}));

// @route   PUT /api/stores/:id
// @desc    Update store
// @access  Private/Store Owner or Admin
router.put('/:id', [isStoreOwner, isAdmin], validateStore, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const store = await Store.findByPk(req.params.id);
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  // Check if user owns the store or is admin
  if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own stores'
    });
  }

  await store.update(req.body);

  res.json({
    success: true,
    message: 'Store updated successfully',
    data: {
      store
    }
  });
}));

// @route   POST /api/stores/:id/logo
// @desc    Upload store logo
// @access  Private/Store Owner
router.post('/:id/logo', isStoreOwner, upload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file'
    });
  }

  const store = await Store.findByPk(req.params.id);
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  if (store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own stores'
    });
  }

  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bbsr-grocery/stores/logos',
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
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

    // Update store logo
    await store.update({ logo: result.secure_url });

    res.json({
      success: true,
      message: 'Store logo uploaded successfully',
      data: {
        logo: result.secure_url
      }
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
}));

// @route   POST /api/stores/:id/banner
// @desc    Upload store banner
// @access  Private/Store Owner
router.post('/:id/banner', isStoreOwner, upload.single('banner'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file'
    });
  }

  const store = await Store.findByPk(req.params.id);
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  if (store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own stores'
    });
  }

  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bbsr-grocery/stores/banners',
          transformation: [
            { width: 1200, height: 400, crop: 'fill' },
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

    // Update store banner
    await store.update({ banner: result.secure_url });

    res.json({
      success: true,
      message: 'Store banner uploaded successfully',
      data: {
        banner: result.secure_url
      }
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload banner'
    });
  }
}));

// @route   PUT /api/stores/:id/operating-hours
// @desc    Update store operating hours
// @access  Private/Store Owner
router.put('/:id/operating-hours', isStoreOwner, asyncHandler(async (req, res) => {
  const { operatingHours } = req.body;

  if (!operatingHours || typeof operatingHours !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Operating hours are required'
    });
  }

  const store = await Store.findByPk(req.params.id);
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  if (store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own stores'
    });
  }

  await store.update({ operatingHours });

  res.json({
    success: true,
    message: 'Operating hours updated successfully',
    data: {
      operatingHours: store.operatingHours
    }
  });
}));

// @route   DELETE /api/stores/:id
// @desc    Delete store (soft delete)
// @access  Private/Store Owner or Admin
router.delete('/:id', [isStoreOwner, isAdmin], asyncHandler(async (req, res) => {
  const store = await Store.findByPk(req.params.id);
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only delete your own stores'
    });
  }

  // Soft delete
  await store.update({ isActive: false });

  res.json({
    success: true,
    message: 'Store deactivated successfully'
  });
}));

// @route   GET /api/stores/my-stores
// @desc    Get stores owned by current user
// @access  Private/Store Owner
router.get('/my-stores', isStoreOwner, asyncHandler(async (req, res) => {
  const stores = await Store.findAll({
    where: { ownerId: req.user.id },
    include: [
      {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'stockQuantity', 'isAvailable']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      stores
    }
  });
}));

module.exports = router;
