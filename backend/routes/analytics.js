const express = require('express');
const { query, validationResult } = require('express-validator');
const { authenticateToken, isAdmin, isStoreOwner } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { User, Store, Product, Order } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private (Admin/Store Owner)
 */
router.get('/dashboard', [
  authenticateToken,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('storeId').optional().isUUID().withMessage('Invalid store ID'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { startDate, endDate, storeId } = req.query;
  const whereClause = {};
  const orderWhereClause = {};

  // Date filtering
  if (startDate && endDate) {
    orderWhereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Store filtering for store owners
  if (req.user.role === 'store_owner') {
    whereClause.ownerId = req.user.id;
    if (storeId) {
      whereClause.id = storeId;
    }
  } else if (storeId) {
    whereClause.id = storeId;
  }

  // Get total stores
  const totalStores = await Store.count({ where: whereClause });

  // Get total products
  const totalProducts = await Product.count({
    include: [{
      model: Store,
      where: whereClause,
      attributes: []
    }]
  });

  // Get total orders and revenue
  const orderStats = await Order.findAll({
    include: [{
      model: Store,
      where: whereClause,
      attributes: []
    }],
    where: orderWhereClause,
    attributes: [
      [Op.fn('COUNT', Op.col('Order.id')), 'totalOrders'],
      [Op.fn('SUM', Op.col('Order.total')), 'totalRevenue'],
      [Op.fn('AVG', Op.col('Order.total')), 'averageOrderValue'],
      [Op.fn('COUNT', Op.literal('CASE WHEN Order.status = "completed" THEN 1 END')), 'completedOrders'],
      [Op.fn('COUNT', Op.literal('CASE WHEN Order.status = "cancelled" THEN 1 END')), 'cancelledOrders'],
    ],
    raw: true
  });

  // Get total customers
  const totalCustomers = await User.count({
    where: { role: 'customer' }
  });

  // Get total delivery partners
  const totalDeliveryPartners = await User.count({
    where: { role: 'delivery_partner' }
  });

  // Get recent orders
  const recentOrders = await Order.findAll({
    include: [
      { model: Store, attributes: ['name', 'logo'] },
      { model: User, as: 'customer', attributes: ['name', 'email'] }
    ],
    where: orderWhereClause,
    order: [['createdAt', 'DESC']],
    limit: 10,
    attributes: ['id', 'orderNumber', 'total', 'status', 'createdAt']
  });

  // Get top performing stores
  const topStores = await Store.findAll({
    where: whereClause,
    include: [{
      model: Order,
      where: orderWhereClause,
      attributes: []
    }],
    attributes: [
      'id', 'name', 'logo', 'rating',
      [Op.fn('COUNT', Op.col('Orders.id')), 'orderCount'],
      [Op.fn('SUM', Op.col('Orders.total')), 'totalRevenue'],
      [Op.fn('AVG', Op.col('Orders.total')), 'averageOrderValue']
    ],
    group: ['Store.id'],
    order: [[Op.fn('SUM', Op.col('Orders.total')), 'DESC']],
    limit: 5
  });

  res.json({
    overview: {
      totalStores,
      totalProducts,
      totalCustomers,
      totalDeliveryPartners,
      ...orderStats[0]
    },
    recentOrders,
    topStores
  });
}));

/**
 * @route   GET /api/analytics/sales
 * @desc    Get sales analytics
 * @access  Private (Admin/Store Owner)
 */
router.get('/sales', [
  authenticateToken,
  query('period').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('storeId').optional().isUUID().withMessage('Invalid store ID'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { period, startDate, endDate, storeId } = req.query;
  const whereClause = {};
  const orderWhereClause = {};

  // Date filtering
  if (startDate && endDate) {
    orderWhereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Store filtering
  if (req.user.role === 'store_owner') {
    whereClause.ownerId = req.user.id;
    if (storeId) {
      whereClause.id = storeId;
    }
  } else if (storeId) {
    whereClause.id = storeId;
  }

  let dateFormat, groupBy;
  switch (period) {
    case 'daily':
      dateFormat = 'YYYY-MM-DD';
      groupBy = Op.fn('DATE', Op.col('Order.createdAt'));
      break;
    case 'weekly':
      dateFormat = 'YYYY-WW';
      groupBy = Op.fn('DATE_TRUNC', 'week', Op.col('Order.createdAt'));
      break;
    case 'monthly':
      dateFormat = 'YYYY-MM';
      groupBy = Op.fn('DATE_TRUNC', 'month', Op.col('Order.createdAt'));
      break;
    case 'yearly':
      dateFormat = 'YYYY';
      groupBy = Op.fn('DATE_TRUNC', 'year', Op.col('Order.createdAt'));
      break;
  }

  const salesData = await Order.findAll({
    include: [{
      model: Store,
      where: whereClause,
      attributes: []
    }],
    where: orderWhereClause,
    attributes: [
      [groupBy, 'date'],
      [Op.fn('COUNT', Op.col('Order.id')), 'orderCount'],
      [Op.fn('SUM', Op.col('Order.total')), 'revenue'],
      [Op.fn('AVG', Op.col('Order.total')), 'averageOrderValue'],
      [Op.fn('COUNT', Op.literal('CASE WHEN Order.status = "completed" THEN 1 END')), 'completedOrders'],
      [Op.fn('COUNT', Op.literal('CASE WHEN Order.status = "cancelled" THEN 1 END')), 'cancelledOrders'],
    ],
    group: ['date'],
    order: [['date', 'ASC']],
    raw: true
  });

  // Calculate growth rates
  const growthData = salesData.map((item, index) => {
    if (index === 0) {
      return { ...item, growth: 0 };
    }
    const previousRevenue = salesData[index - 1].revenue || 0;
    const currentRevenue = item.revenue || 0;
    const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    return { ...item, growth: Math.round(growth * 100) / 100 };
  });

  res.json({
    period,
    salesData: growthData,
    summary: {
      totalOrders: salesData.reduce((sum, item) => sum + parseInt(item.orderCount), 0),
      totalRevenue: salesData.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0),
      averageOrderValue: salesData.reduce((sum, item) => sum + parseFloat(item.averageOrderValue || 0), 0) / salesData.length,
      totalCompleted: salesData.reduce((sum, item) => sum + parseInt(item.completedOrders), 0),
      totalCancelled: salesData.reduce((sum, item) => sum + parseInt(item.cancelledOrders), 0),
    }
  });
}));

/**
 * @route   GET /api/analytics/products
 * @desc    Get product analytics
 * @access  Private (Admin/Store Owner)
 */
router.get('/products', [
  authenticateToken,
  query('storeId').optional().isUUID().withMessage('Invalid store ID'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { storeId, limit = 10 } = req.query;
  const whereClause = {};

  // Store filtering
  if (req.user.role === 'store_owner') {
    whereClause.ownerId = req.user.id;
    if (storeId) {
      whereClause.id = storeId;
    }
  } else if (storeId) {
    whereClause.id = storeId;
  }

  // Get top selling products
  const topSellingProducts = await Product.findAll({
    include: [
      {
        model: Store,
        where: whereClause,
        attributes: ['name']
      },
      {
        model: Order,
        attributes: []
      }
    ],
    attributes: [
      'id', 'name', 'price', 'stock', 'rating', 'image',
      [Op.fn('COUNT', Op.col('Orders.id')), 'orderCount'],
      [Op.fn('SUM', Op.literal('CAST(Orders.items->>"quantity" AS INTEGER)')), 'totalQuantity'],
      [Op.fn('AVG', Op.col('Product.rating')), 'averageRating']
    ],
    group: ['Product.id', 'Store.id'],
    order: [[Op.fn('COUNT', Op.col('Orders.id')), 'DESC']],
    limit: parseInt(limit)
  });

  // Get low stock products
  const lowStockProducts = await Product.findAll({
    include: [{
      model: Store,
      where: whereClause,
      attributes: ['name']
    }],
    where: {
      stock: { [Op.lt]: 10 },
      isActive: true
    },
    attributes: ['id', 'name', 'stock', 'price', 'image'],
    order: [['stock', 'ASC']],
    limit: 10
  });

  // Get product categories performance
  const categoryPerformance = await Product.findAll({
    include: [{
      model: Store,
      where: whereClause,
      attributes: []
    }],
    attributes: [
      'category',
      [Op.fn('COUNT', Op.col('Product.id')), 'productCount'],
      [Op.fn('AVG', Op.col('Product.price')), 'averagePrice'],
      [Op.fn('AVG', Op.col('Product.rating')), 'averageRating']
    ],
    group: ['category'],
    order: [[Op.fn('COUNT', Op.col('Product.id')), 'DESC']]
  });

  res.json({
    topSellingProducts,
    lowStockProducts,
    categoryPerformance
  });
}));

/**
 * @route   GET /api/analytics/customers
 * @desc    Get customer analytics
 * @access  Private (Admin)
 */
router.get('/customers', [
  authenticateToken,
  isAdmin,
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { period = '30d' } = req.query;
  
  // Calculate date range
  const endDate = new Date();
  let startDate;
  switch (period) {
    case '7d':
      startDate = moment().subtract(7, 'days').toDate();
      break;
    case '30d':
      startDate = moment().subtract(30, 'days').toDate();
      break;
    case '90d':
      startDate = moment().subtract(90, 'days').toDate();
      break;
    case '1y':
      startDate = moment().subtract(1, 'year').toDate();
      break;
  }

  // Get customer registration trends
  const customerTrends = await User.findAll({
    where: {
      role: 'customer',
      createdAt: { [Op.between]: [startDate, endDate] }
    },
    attributes: [
      [Op.fn('DATE', Op.col('createdAt')), 'date'],
      [Op.fn('COUNT', Op.col('id')), 'newCustomers']
    ],
    group: [Op.fn('DATE', Op.col('createdAt'))],
    order: [[Op.fn('DATE', Op.col('createdAt')), 'ASC']],
    raw: true
  });

  // Get top customers by order value
  const topCustomers = await User.findAll({
    where: { role: 'customer' },
    include: [{
      model: Order,
      attributes: []
    }],
    attributes: [
      'id', 'name', 'email', 'phone', 'createdAt',
      [Op.fn('COUNT', Op.col('Orders.id')), 'orderCount'],
      [Op.fn('SUM', Op.col('Orders.total')), 'totalSpent'],
      [Op.fn('AVG', Op.col('Orders.total')), 'averageOrderValue']
    ],
    group: ['User.id'],
    order: [[Op.fn('SUM', Op.col('Orders.total')), 'DESC']],
    limit: 10
  });

  // Get customer segments
  const customerSegments = await User.findAll({
    where: { role: 'customer' },
    include: [{
      model: Order,
      attributes: []
    }],
    attributes: [
      [Op.literal(`
        CASE 
          WHEN COUNT(Orders.id) = 0 THEN 'New'
          WHEN COUNT(Orders.id) BETWEEN 1 AND 5 THEN 'Regular'
          WHEN COUNT(Orders.id) BETWEEN 6 AND 20 THEN 'Frequent'
          ELSE 'VIP'
        END
      `), 'segment'],
      [Op.fn('COUNT', Op.col('User.id')), 'customerCount']
    ],
    group: ['segment'],
    raw: true
  });

  // Get customer retention rate
  const totalCustomers = await User.count({ where: { role: 'customer' } });
  const activeCustomers = await User.count({
    where: { role: 'customer' },
    include: [{
      model: Order,
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: []
    }]
  });

  const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

  res.json({
    period,
    customerTrends,
    topCustomers,
    customerSegments,
    retentionRate: Math.round(retentionRate * 100) / 100,
    summary: {
      totalCustomers,
      activeCustomers,
      newCustomers: customerTrends.reduce((sum, item) => sum + parseInt(item.newCustomers), 0)
    }
  });
}));

/**
 * @route   GET /api/analytics/delivery
 * @desc    Get delivery analytics
 * @access  Private (Admin)
 */
router.get('/delivery', [
  authenticateToken,
  isAdmin,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { startDate, endDate } = req.query;
  const whereClause = {};

  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Get delivery performance
  const deliveryStats = await Order.findAll({
    where: {
      ...whereClause,
      status: { [Op.in]: ['confirmed', 'out_for_delivery', 'delivered', 'cancelled'] }
    },
    attributes: [
      'status',
      [Op.fn('COUNT', Op.col('id')), 'orderCount'],
      [Op.fn('AVG', Op.literal('EXTRACT(EPOCH FROM (deliveredAt - createdAt))/3600')), 'averageDeliveryTime'],
      [Op.fn('AVG', Op.col('deliveryFee')), 'averageDeliveryFee']
    ],
    group: ['status'],
    raw: true
  });

  // Get top delivery partners
  const topDeliveryPartners = await User.findAll({
    where: { role: 'delivery_partner' },
    include: [{
      model: Order,
      as: 'deliveries',
      where: whereClause,
      attributes: []
    }],
    attributes: [
      'id', 'name', 'email', 'phone',
      [Op.fn('COUNT', Op.col('deliveries.id')), 'deliveryCount'],
      [Op.fn('AVG', Op.literal('EXTRACT(EPOCH FROM (deliveries.deliveredAt - deliveries.createdAt))/3600')), 'averageDeliveryTime'],
      [Op.fn('SUM', Op.col('deliveries.deliveryFee')), 'totalEarnings']
    ],
    group: ['User.id'],
    order: [[Op.fn('COUNT', Op.col('deliveries.id')), 'DESC']],
    limit: 10
  });

  // Get delivery time distribution
  const deliveryTimeDistribution = await Order.findAll({
    where: {
      ...whereClause,
      status: 'delivered',
      deliveredAt: { [Op.ne]: null }
    },
    attributes: [
      [Op.literal(`
        CASE 
          WHEN EXTRACT(EPOCH FROM (deliveredAt - createdAt))/3600 < 1 THEN 'Under 1 hour'
          WHEN EXTRACT(EPOCH FROM (deliveredAt - createdAt))/3600 < 2 THEN '1-2 hours'
          WHEN EXTRACT(EPOCH FROM (deliveredAt - createdAt))/3600 < 3 THEN '2-3 hours'
          ELSE 'Over 3 hours'
        END
      `), 'timeRange'],
      [Op.fn('COUNT', Op.col('id')), 'orderCount']
    ],
    group: ['timeRange'],
    raw: true
  });

  res.json({
    deliveryStats,
    topDeliveryPartners,
    deliveryTimeDistribution
  });
}));

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private (Admin/Store Owner)
 */
router.get('/revenue', [
  authenticateToken,
  query('period').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('storeId').optional().isUUID().withMessage('Invalid store ID'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { period, startDate, endDate, storeId } = req.query;
  const whereClause = {};
  const orderWhereClause = {};

  // Date filtering
  if (startDate && endDate) {
    orderWhereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Store filtering
  if (req.user.role === 'store_owner') {
    whereClause.ownerId = req.user.id;
    if (storeId) {
      whereClause.id = storeId;
    }
  } else if (storeId) {
    whereClause.id = storeId;
  }

  let groupBy;
  switch (period) {
    case 'daily':
      groupBy = Op.fn('DATE', Op.col('Order.createdAt'));
      break;
    case 'weekly':
      groupBy = Op.fn('DATE_TRUNC', 'week', Op.col('Order.createdAt'));
      break;
    case 'monthly':
      groupBy = Op.fn('DATE_TRUNC', 'month', Op.col('Order.createdAt'));
      break;
    case 'yearly':
      groupBy = Op.fn('DATE_TRUNC', 'year', Op.col('Order.createdAt'));
      break;
  }

  const revenueData = await Order.findAll({
    include: [{
      model: Store,
      where: whereClause,
      attributes: []
    }],
    where: {
      ...orderWhereClause,
      status: { [Op.in]: ['confirmed', 'out_for_delivery', 'delivered'] }
    },
    attributes: [
      [groupBy, 'date'],
      [Op.fn('SUM', Op.col('Order.total')), 'grossRevenue'],
      [Op.fn('SUM', Op.col('Order.deliveryFee')), 'deliveryRevenue'],
      [Op.fn('COUNT', Op.col('Order.id')), 'orderCount'],
      [Op.fn('AVG', Op.col('Order.total')), 'averageOrderValue']
    ],
    group: ['date'],
    order: [['date', 'ASC']],
    raw: true
  });

  // Calculate net revenue (assuming commission is 10%)
  const revenueWithNet = revenueData.map(item => ({
    ...item,
    netRevenue: parseFloat(item.grossRevenue || 0) * 0.9,
    commission: parseFloat(item.grossRevenue || 0) * 0.1
  }));

  res.json({
    period,
    revenueData: revenueWithNet,
    summary: {
      totalGrossRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.grossRevenue || 0), 0),
      totalNetRevenue: revenueWithNet.reduce((sum, item) => sum + item.netRevenue, 0),
      totalDeliveryRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.deliveryRevenue || 0), 0),
      totalCommission: revenueWithNet.reduce((sum, item) => sum + item.commission, 0),
      totalOrders: revenueData.reduce((sum, item) => sum + parseInt(item.orderCount), 0),
      averageOrderValue: revenueData.reduce((sum, item) => sum + parseFloat(item.averageOrderValue || 0), 0) / revenueData.length
    }
  });
}));

module.exports = router;
