const express = require('express');
const { body, validationResult } = require('express-validator');
const { Product, Store } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { isStoreOwner, isAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { dynamoCacheService, s3Service } = require('../services/aws.service');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
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
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('storeId')
    .isUUID()
    .withMessage('Valid store ID is required'),
  body('category')
    .isIn([
      'fruits-vegetables',
      'dairy-bakery',
      'meat-fish',
      'pantry-staples',
      'beverages',
      'snacks',
      'household',
      'personal-care',
      'baby-care',
      'pet-supplies',
      'frozen-foods',
      'organic',
      'imported'
    ])
    .withMessage('Invalid product category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('unit')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number')
];

// Helper function to cache product data
const cacheProductData = async (product) => {
  try {
    if (dynamoCacheService) {
      await dynamoCacheService.cacheProduct(product);
    }
  } catch (error) {
    console.log('⚠️ Product caching failed, continuing without cache:', error.message);
  }
};

// Helper function to get cached product
const getCachedProduct = async (productId) => {
  try {
    if (dynamoCacheService) {
      return await dynamoCacheService.getCachedProduct(productId);
    }
  } catch (error) {
    console.log('⚠️ Product cache retrieval failed:', error.message);
  }
  return null;
};

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    category, 
    storeId,
    search, 
    minPrice, 
    maxPrice,
    inStock,
    isFeatured,
    isOrganic,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  try {
    // Try to get from cache first if no complex filters
    if (!search && !minPrice && !maxPrice && !inStock && !isFeatured && !isOrganic) {
      if (category && dynamoCacheService) {
        const cachedProducts = await dynamoCacheService.getProductsByCategory(category);
        if (cachedProducts && cachedProducts.length > 0) {
          console.log(`✅ Retrieved ${cachedProducts.length} products for category ${category} from cache`);
          
          // Apply pagination to cached results
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + parseInt(limit);
          const paginatedProducts = cachedProducts.slice(startIndex, endIndex);
          
          return res.json({
            success: true,
            data: {
              products: paginatedProducts,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: cachedProducts.length,
                pages: Math.ceil(cachedProducts.length / limit)
              },
              source: 'cache'
            }
          });
        }
      }
    }

    // Fallback to database
    console.log('🔄 Fetching products from database...');
    
    const offset = (page - 1) * limit;
    const whereClause = { isAvailable: true };

    // Apply filters
    if (category) whereClause.category = category;
    if (storeId) whereClause.storeId = storeId;
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { description: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { brand: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[require('sequelize').Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[require('sequelize').Op.lte] = parseFloat(maxPrice);
    }
    if (inStock === 'true') whereClause.stockQuantity = { [require('sequelize').Op.gt]: 0 };
    if (isFeatured === 'true') whereClause.isFeatured = true;
    if (isOrganic === 'true') whereClause.isOrganic = true;

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'logo', 'rating']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    // Cache the results for future use
    if (products.length > 0 && !search && !minPrice && !maxPrice) {
      await cacheProductData(products);
    }

    console.log(`✅ Retrieved ${products.length} products from database`);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        source: 'database'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
}));

// @route   GET /api/products/search
// @desc    Search products with advanced filters
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  const { 
    q, 
    category, 
    storeId, 
    minPrice, 
    maxPrice,
    inStock,
    limit = 20 
  } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  try {
    console.log(`🔍 Searching products for query: "${q}"`);
    
    const whereClause = {
      isAvailable: true,
      [require('sequelize').Op.or]: [
        { name: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { description: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { brand: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { tags: { [require('sequelize').Op.contains]: [q] } }
      ]
    };

    if (category) whereClause.category = category;
    if (storeId) whereClause.storeId = storeId;
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[require('sequelize').Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[require('sequelize').Op.lte] = parseFloat(maxPrice);
    }
    if (inStock === 'true') whereClause.stockQuantity = { [require('sequelize').Op.gt]: 0 };

    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'logo']
        }
      ],
      limit: parseInt(limit),
      order: [['rating', 'DESC'], ['totalSold', 'DESC']]
    });

    console.log(`✅ Search completed, found ${products.length} products`);
    
    res.json({
      success: true,
      data: {
        products,
        total: products.length,
        query: q
      }
    });
    
  } catch (error) {
    console.error('❌ Error searching products:', error.message);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
}));

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    console.log('⭐ Fetching featured products...');
    
    const products = await Product.findAll({
      where: { 
        isAvailable: true, 
        isFeatured: true 
      },
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'logo']
        }
      ],
      limit: parseInt(limit),
      order: [['rating', 'DESC']]
    });

    console.log(`✅ Retrieved ${products.length} featured products`);
    
    res.json({
      success: true,
      data: {
        products
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching featured products:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
}));

// @route   GET /api/products/categories
// @desc    Get product categories with counts
// @access  Public
router.get('/categories', asyncHandler(async (req, res) => {
  try {
    console.log('📂 Fetching product categories...');
    
    const categories = await Product.findAll({
      attributes: [
        'category',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { isAvailable: true },
      group: ['category'],
      order: [['category', 'ASC']]
    });

    console.log(`✅ Retrieved ${categories.length} categories`);
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
}));

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const productId = req.params.id;
  
  try {
    // Try to get from cache first
    let product = await getCachedProduct(productId);
    
    if (product) {
      console.log(`✅ Product ${productId} retrieved from cache`);
      return res.json({
        success: true,
        data: {
          product,
          source: 'cache'
        }
      });
    }

    // Fallback to database
    console.log(`🔄 Fetching product ${productId} from database...`);
    
    product = await Product.findByPk(productId, {
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'logo', 'rating', 'phone', 'address']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Cache the product for future use
    await cacheProductData(product);

    console.log(`✅ Product ${productId} retrieved from database`);
    
    res.json({
      success: true,
      data: {
        product,
        source: 'database'
      }
    });
    
  } catch (error) {
    console.error(`❌ Error fetching product ${productId}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
}));

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Store Owner
router.post('/', isStoreOwner, validateProduct, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { storeId, ...productData } = req.body;

    // Verify store ownership
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (store.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only add products to your own stores'
      });
    }

    // Generate SKU
    const sku = `BBSR-${storeId.slice(0, 8)}-${uuidv4().slice(0, 8)}`;

    const product = await Product.create({
      ...productData,
      storeId,
      sku
    });

    // Cache the new product
    await cacheProductData(product);

    console.log(`✅ Product created successfully: ${product.id}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
}));

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Store Owner or Admin
router.put('/:id', [isStoreOwner, isAdmin], validateProduct, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store' }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the store or is admin
    if (req.user.role !== 'admin' && product.store.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update products from your own stores'
      });
    }

    await product.update(req.body);

    // Update cache
    await cacheProductData(product);

    console.log(`✅ Product updated successfully: ${product.id}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
}));

// @route   POST /api/products/:id/images
// @desc    Upload product images
// @access  Private/Store Owner
router.post('/:id/images', isStoreOwner, upload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please upload at least one image'
    });
  }

  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store' }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.store.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update products from your own stores'
      });
    }

    const uploadedImages = [];

    // Try AWS S3 first, fallback to local storage
    if (s3Service) {
      console.log('☁️ Uploading images to AWS S3...');
      
      for (const file of req.files) {
        const key = `products/${product.id}/${uuidv4()}-${file.originalname}`;
        const result = await s3Service.uploadImage(
          file.buffer, 
          key, 
          file.mimetype
        );
        
        if (result.success) {
          uploadedImages.push(result.url);
          console.log(`✅ Image uploaded to S3: ${key}`);
        } else {
          console.log(`⚠️ S3 upload failed for ${file.originalname}, using fallback`);
          // Fallback to local storage or base64
          uploadedImages.push(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
        }
      }
    } else {
      console.log('⚠️ S3 service not available, using base64 encoding');
      // Fallback to base64 encoding
      for (const file of req.files) {
        uploadedImages.push(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
      }
    }

    // Update product images
    const currentImages = product.images || [];
    const newImages = [...currentImages, ...uploadedImages];
    
    await product.update({ 
      images: newImages,
      thumbnail: newImages[0] // Set first image as thumbnail
    });

    // Update cache
    await cacheProductData(product);

    console.log(`✅ ${uploadedImages.length} images uploaded successfully for product ${product.id}`);

    res.json({
      success: true,
      message: 'Product images uploaded successfully',
      data: {
        images: newImages
      }
    });
    
  } catch (error) {
    console.error('❌ Error uploading images:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
}));

// @route   PUT /api/products/:id/stock
// @desc    Update product stock
// @access  Private/Store Owner
router.put('/:id/stock', isStoreOwner, [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { quantity, operation } = req.body;

    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store' }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.store.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update products from your own stores'
      });
    }

    await product.updateStock(quantity, operation);

    // Update cache
    await cacheProductData(product);

    console.log(`✅ Stock updated for product ${product.id}: ${operation} ${quantity}`);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        stockQuantity: product.stockQuantity,
        isAvailable: product.isAvailable
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating stock:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
}));

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private/Store Owner or Admin
router.delete('/:id', [isStoreOwner, isAdmin], asyncHandler(async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store' }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role !== 'admin' && product.store.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete products from your own stores'
      });
    }

    // Soft delete
    await product.update({ isAvailable: false });

    // Clear cache
    if (dynamoCacheService) {
      await dynamoCacheService.clearProductCache(product.id);
    }

    console.log(`✅ Product deactivated: ${product.id}`);

    res.json({
      success: true,
      message: 'Product deactivated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deactivating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate product',
      error: error.message
    });
  }
}));

// @route   POST /api/products/:id/rate
// @desc    Rate a product
// @access  Private
router.post('/:id/rate', require('../middleware/auth.middleware').authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { rating, review } = req.body;

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product rating
    await product.updateRating(rating);

    // Update cache
    await cacheProductData(product);

    console.log(`✅ Product rated: ${product.id} - ${rating} stars`);

    res.json({
      success: true,
      message: 'Product rated successfully',
      data: {
        rating: product.rating,
        totalRatings: product.totalRatings
      }
    });
    
  } catch (error) {
    console.error('❌ Error rating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to rate product',
      error: error.message
    });
  }
}));

module.exports = router;
