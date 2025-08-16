const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, User, Store } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { isDeliveryPartner, isAdmin } = require('../middleware/auth.middleware');
const { getDistance, getCenter } = require('geolib');
const moment = require('moment');

const router = express.Router();

// @route   GET /api/delivery/available-orders
// @desc    Get available orders for delivery partners
// @access  Private/Delivery Partner
router.get('/available-orders', isDeliveryPartner, asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, limit = 20 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Current location (lat, lng) is required'
    });
  }

  // Get orders ready for pickup or out for delivery without assigned delivery partner
  const orders = await Order.findAll({
    where: {
      status: ['ready_for_pickup', 'out_for_delivery'],
      deliveryPartnerId: null
    },
    include: [
      {
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'logo', 'coordinates', 'phone']
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'deliveryAddress']
      }
    ],
    limit: parseInt(limit),
    order: [['createdAt', 'ASC']]
  });

  // Calculate distances and filter by radius
  const ordersWithDistance = orders
    .map(order => {
      const storeDistance = getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { 
          latitude: order.store.coordinates.lat, 
          longitude: order.store.coordinates.lng 
        }
      );

      const deliveryDistance = getDistance(
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        { 
          latitude: order.deliveryAddress.coordinates.lat, 
          longitude: order.deliveryAddress.coordinates.lng 
        }
      );

      return {
        ...order.toJSON(),
        storeDistance: storeDistance / 1000, // Convert to km
        deliveryDistance: deliveryDistance / 1000,
        totalDistance: (storeDistance + deliveryDistance) / 1000
      };
    })
    .filter(order => order.storeDistance <= radius)
    .sort((a, b) => a.totalDistance - b.totalDistance);

  res.json({
    success: true,
    data: {
      orders: ordersWithDistance
    }
  });
}));

// @route   GET /api/delivery/my-deliveries
// @desc    Get delivery partner's assigned deliveries
// @access  Private/Delivery Partner
router.get('/my-deliveries', isDeliveryPartner, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { deliveryPartnerId: req.user.id };
  if (status) whereClause.status = status;

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'logo', 'coordinates', 'phone']
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'deliveryAddress']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
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

// @route   POST /api/delivery/accept-order
// @desc    Accept delivery order
// @access  Private/Delivery Partner
router.post('/accept-order', isDeliveryPartner, [
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('currentLocation').isObject().withMessage('Current location is required'),
  body('currentLocation.lat').isFloat().withMessage('Valid latitude is required'),
  body('currentLocation.lng').isFloat().withMessage('Valid longitude is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { orderId, currentLocation } = req.body;

  const order = await Order.findByPk(orderId, {
    include: [{ model: Store, as: 'store' }]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.deliveryPartnerId) {
    return res.status(400).json({
      success: false,
      message: 'Order is already assigned to another delivery partner'
    });
  }

  if (!['ready_for_pickup', 'out_for_delivery'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order is not ready for delivery'
    });
  }

  // Check if delivery partner is within reasonable distance
  const distance = getDistance(
    { latitude: currentLocation.lat, longitude: currentLocation.lng },
    { 
      latitude: order.store.coordinates.lat, 
      longitude: order.store.coordinates.lng 
    }
  );

  if (distance > 50000) { // 50km limit
    return res.status(400).json({
      success: false,
      message: 'You are too far from the store to accept this delivery'
    });
  }

  // Assign order to delivery partner
  await order.update({ deliveryPartnerId: req.user.id });

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: {
      order
    }
  });
}));

// @route   POST /api/delivery/update-location
// @desc    Update delivery partner's current location
// @access  Private/Delivery Partner
router.post('/update-location', isDeliveryPartner, [
  body('lat').isFloat().withMessage('Valid latitude is required'),
  body('lng').isFloat().withMessage('Valid longitude is required'),
  body('orderId').optional().isUUID().withMessage('Valid order ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { lat, lng, orderId } = req.body;

  // Update delivery partner's location
  await req.user.update({
    address: {
      ...req.user.address,
      coordinates: { lat, lng }
    }
  });

  // If orderId is provided, emit location update for real-time tracking
  if (orderId) {
    // This would typically emit to Socket.IO for real-time updates
    // For now, we'll just return success
  }

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location: { lat, lng }
    }
  });
}));

// @route   POST /api/delivery/start-delivery
// @desc    Start delivery for an order
// @access  Private/Delivery Partner
router.post('/start-delivery', isDeliveryPartner, [
  body('orderId').isUUID().withMessage('Valid order ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { orderId } = req.body;

  const order = await Order.findByPk(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.deliveryPartnerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This order is not assigned to you'
    });
  }

  if (order.status !== 'ready_for_pickup') {
    return res.status(400).json({
      success: false,
      message: 'Order is not ready for pickup'
    });
  }

  // Update order status to out for delivery
  await order.updateStatus('out_for_delivery', 'Delivery partner started delivery');

  res.json({
    success: true,
    message: 'Delivery started successfully',
    data: {
      order
    }
  });
}));

// @route   POST /api/delivery/complete-delivery
// @desc    Complete delivery for an order
// @access  Private/Delivery Partner
router.post('/complete-delivery', isDeliveryPartner, [
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('signature').optional().isString().withMessage('Signature must be a string'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { orderId, signature, notes } = req.body;

  const order = await Order.findByPk(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.deliveryPartnerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This order is not assigned to you'
    });
  }

  if (order.status !== 'out_for_delivery') {
    return res.status(400).json({
      success: false,
      message: 'Order is not out for delivery'
    });
  }

  // Update order status to delivered
  const deliveryNotes = notes ? `Delivery completed. ${notes}` : 'Delivery completed';
  await order.updateStatus('delivered', deliveryNotes);

  res.json({
    success: true,
    message: 'Delivery completed successfully',
    data: {
      order
    }
  });
}));

// @route   GET /api/delivery/route-optimization
// @desc    Get optimized delivery route for multiple orders
// @access  Private/Delivery Partner
router.get('/route-optimization', isDeliveryPartner, asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Current location (lat, lng) is required'
    });
  }

  // Get all active deliveries for this delivery partner
  const orders = await Order.findAll({
    where: {
      deliveryPartnerId: req.user.id,
      status: ['ready_for_pickup', 'out_for_delivery']
    },
    include: [
      {
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'coordinates']
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'name', 'deliveryAddress']
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  if (orders.length === 0) {
    return res.json({
      success: true,
      data: {
        route: [],
        totalDistance: 0,
        estimatedTime: 0
      }
    });
  }

  // Create route points
  const routePoints = [];
  
  // Add current location as starting point
  routePoints.push({
    type: 'start',
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    name: 'Current Location'
  });

  // Add store pickup points
  orders.forEach(order => {
    routePoints.push({
      type: 'pickup',
      orderId: order.id,
      coordinates: order.store.coordinates,
      name: order.store.name,
      orderNumber: order.orderNumber
    });
  });

  // Add delivery points
  orders.forEach(order => {
    routePoints.push({
      type: 'delivery',
      orderId: order.id,
      coordinates: order.deliveryAddress.coordinates,
      name: order.customer.name,
      orderNumber: order.orderNumber,
      address: order.deliveryAddress
    });
  });

  // Simple route optimization (nearest neighbor algorithm)
  const optimizedRoute = optimizeRoute(routePoints);

  // Calculate total distance and estimated time
  let totalDistance = 0;
  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    const distance = getDistance(
      optimizedRoute[i].coordinates,
      optimizedRoute[i + 1].coordinates
    );
    totalDistance += distance;
  }

  const estimatedTime = Math.ceil(totalDistance / 1000 / 20 * 60); // Assuming 20 km/h average speed

  res.json({
    success: true,
    data: {
      route: optimizedRoute,
      totalDistance: totalDistance / 1000, // Convert to km
      estimatedTime, // in minutes
      orderCount: orders.length
    }
  });
}));

// @route   GET /api/delivery/earnings
// @desc    Get delivery partner earnings
// @access  Private/Delivery Partner
router.get('/earnings', isDeliveryPartner, asyncHandler(async (req, res) => {
  const { startDate, endDate, period = 'month' } = req.query;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  } else {
    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    dateFilter = {
      createdAt: {
        [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
      }
    };
  }

  const orders = await Order.findAll({
    where: {
      deliveryPartnerId: req.user.id,
      status: 'delivered',
      ...dateFilter
    },
    attributes: ['id', 'deliveryFee', 'createdAt', 'actualDeliveryTime']
  });

  const totalEarnings = orders.reduce((sum, order) => sum + parseFloat(order.deliveryFee), 0);
  const totalDeliveries = orders.length;
  const averageEarnings = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  // Calculate earnings by day
  const earningsByDay = {};
  orders.forEach(order => {
    const date = moment(order.createdAt).format('YYYY-MM-DD');
    earningsByDay[date] = (earningsByDay[date] || 0) + parseFloat(order.deliveryFee);
  });

  res.json({
    success: true,
    data: {
      totalEarnings,
      totalDeliveries,
      averageEarnings,
      earningsByDay,
      period: {
        startDate: startDate || moment().startOf('month').format('YYYY-MM-DD'),
        endDate: endDate || moment().endOf('month').format('YYYY-MM-DD')
      }
    }
  });
}));

// Helper function for route optimization (Nearest Neighbor algorithm)
function optimizeRoute(points) {
  if (points.length <= 1) return points;

  const route = [points[0]]; // Start with current location
  const unvisited = points.slice(1);

  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIndex = 0;
    let minDistance = Infinity;

    // Find nearest unvisited point
    for (let i = 0; i < unvisited.length; i++) {
      const distance = getDistance(current.coordinates, unvisited[i].coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    // Add nearest point to route
    route.push(unvisited[nearestIndex]);
    unvisited.splice(nearestIndex, 1);
  }

  return route;
}

module.exports = router;
