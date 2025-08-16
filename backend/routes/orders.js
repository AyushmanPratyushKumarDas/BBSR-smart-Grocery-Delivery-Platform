const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, User, Store, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { isAdmin, isStoreOwner, isDeliveryPartner } = require('../middleware/auth.middleware');
const { getDistance } = require('geolib');
const moment = require('moment');

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('storeId')
    .isUUID()
    .withMessage('Valid store ID is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('items.*.productId')
    .isUUID()
    .withMessage('Valid product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('deliveryAddress')
    .isObject()
    .withMessage('Delivery address is required'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'wallet', 'net_banking'])
    .withMessage('Invalid payment method')
];

// @route   GET /api/orders
// @desc    Get orders with filters
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    storeId,
    customerId,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Apply filters based on user role
  if (req.user.role === 'customer') {
    whereClause.customerId = req.user.id;
  } else if (req.user.role === 'store_owner') {
    whereClause.storeId = { [require('sequelize').Op.in]: req.user.stores?.map(s => s.id) || [] };
  } else if (req.user.role === 'delivery_partner') {
    whereClause.deliveryPartnerId = req.user.id;
  }

  if (status) whereClause.status = status;
  if (storeId) whereClause.storeId = storeId;
  if (customerId && req.user.role === 'admin') whereClause.customerId = customerId;
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[require('sequelize').Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[require('sequelize').Op.lte] = new Date(endDate);
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email']
      },
      {
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'logo', 'phone']
      },
      {
        model: User,
        as: 'deliveryPartner',
        attributes: ['id', 'name', 'phone'],
        required: false
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]]
  });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email', 'address']
      },
      {
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'logo', 'phone', 'address', 'coordinates']
      },
      {
        model: User,
        as: 'deliveryPartner',
        attributes: ['id', 'name', 'phone'],
        required: false
      }
    ]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check access permissions
  if (req.user.role === 'customer' && order.customerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (req.user.role === 'store_owner' && order.store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      order
    }
  });
}));

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', validateOrder, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { storeId, items, deliveryAddress, deliveryInstructions, paymentMethod, isScheduled, scheduledTime } = req.body;

  // Verify store exists and is active
  const store = await Store.findByPk(storeId);
  if (!store || !store.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Store not found or inactive'
    });
  }

  // Check if store is open
  if (!store.isOpenNow()) {
    return res.status(400).json({
      success: false,
      message: 'Store is currently closed'
    });
  }

  // Validate and calculate order details
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product || !product.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Product ${item.productId} not found or unavailable`
      });
    }

    if (product.storeId !== storeId) {
      return res.status(400).json({
        success: false,
        message: `Product ${product.name} does not belong to the selected store`
      });
    }

    if (product.stockQuantity < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.name}`
      });
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    validatedItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      total: itemTotal,
      unit: product.unit
    });
  }

  // Calculate delivery fee and total
  const deliveryFee = store.deliveryFee;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax + deliveryFee;

  // Check minimum order amount
  if (subtotal < store.minimumOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount is ₹${store.minimumOrderAmount}`
    });
  }

  // Calculate estimated delivery time
  const preparationTime = store.averagePreparationTime || 30;
  const estimatedDeliveryTime = moment().add(preparationTime + 30, 'minutes').toDate();

  // Create order
  const order = await Order.create({
    customerId: req.user.id,
    storeId,
    items: validatedItems,
    subtotal,
    tax,
    deliveryFee,
    total,
    paymentMethod,
    deliveryAddress,
    deliveryInstructions,
    estimatedDeliveryTime,
    isScheduled,
    scheduledTime: isScheduled ? scheduledTime : null
  });

  // Update product stock
  for (const item of validatedItems) {
    const product = await Product.findByPk(item.productId);
    await product.updateStock(item.quantity, 'subtract');
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order
    }
  });
}));

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Store Owner or Delivery Partner
router.put('/:id/status', [isStoreOwner, isDeliveryPartner, isAdmin], [
  body('status')
    .isIn(['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { status, notes } = req.body;

  const order = await Order.findByPk(req.params.id, {
    include: [{ model: Store, as: 'store' }]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check permissions
  if (req.user.role === 'store_owner' && order.store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update orders from your stores'
    });
  }

  if (req.user.role === 'delivery_partner' && order.deliveryPartnerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update orders assigned to you'
    });
  }

  // Validate status transitions
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
    refunded: []
  };

  if (!validTransitions[order.status].includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition from ${order.status} to ${status}`
    });
  }

  // Update order status
  await order.updateStatus(status, notes);

  // If cancelled, restore product stock
  if (status === 'cancelled') {
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        await product.updateStock(item.quantity, 'add');
      }
    }
  }

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order
    }
  });
}));

// @route   PUT /api/orders/:id/assign-delivery
// @desc    Assign delivery partner to order
// @access  Private/Store Owner or Admin
router.put('/:id/assign-delivery', [isStoreOwner, isAdmin], [
  body('deliveryPartnerId')
    .isUUID()
    .withMessage('Valid delivery partner ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { deliveryPartnerId } = req.body;

  const order = await Order.findByPk(req.params.id, {
    include: [{ model: Store, as: 'store' }]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check permissions
  if (req.user.role === 'store_owner' && order.store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only assign delivery to orders from your stores'
    });
  }

  // Verify delivery partner exists and is active
  const deliveryPartner = await User.findOne({
    where: { id: deliveryPartnerId, role: 'delivery_partner', isActive: true }
  });

  if (!deliveryPartner) {
    return res.status(404).json({
      success: false,
      message: 'Delivery partner not found or inactive'
    });
  }

  // Update order
  await order.update({ deliveryPartnerId });

  res.json({
    success: true,
    message: 'Delivery partner assigned successfully',
    data: {
      order
    }
  });
}));

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post('/:id/cancel', [
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { reason } = req.body;

  const order = await Order.findByPk(req.params.id, {
    include: [{ model: Store, as: 'store' }]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user can cancel this order
  if (req.user.role === 'customer' && order.customerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (req.user.role === 'store_owner' && order.store.ownerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if order can be cancelled
  if (!order.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  // Cancel order
  await order.updateStatus('cancelled', reason);

  // Restore product stock
  for (const item of order.items) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      await product.updateStock(item.quantity, 'add');
    }
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: {
      order
    }
  });
}));

// @route   POST /api/orders/:id/rate
// @desc    Rate order
// @access  Private
router.post('/:id/rate', [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Review cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { rating, review } = req.body;

  const order = await Order.findByPk(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user can rate this order
  if (order.customerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if order is delivered
  if (order.status !== 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'You can only rate delivered orders'
    });
  }

  // Update order rating
  await order.update({ rating, review });

  // Update store rating
  const store = await Store.findByPk(order.storeId);
  await store.updateRating(rating);

  res.json({
    success: true,
    message: 'Order rated successfully',
    data: {
      order
    }
  });
}));

// @route   GET /api/orders/tracking/:orderNumber
// @desc    Track order by order number
// @access  Public
router.get('/tracking/:orderNumber', asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: { orderNumber: req.params.orderNumber },
    include: [
      {
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'logo', 'phone']
      },
      {
        model: User,
        as: 'deliveryPartner',
        attributes: ['id', 'name', 'phone'],
        required: false
      }
    ]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: {
      order
    }
  });
}));

module.exports = router;
