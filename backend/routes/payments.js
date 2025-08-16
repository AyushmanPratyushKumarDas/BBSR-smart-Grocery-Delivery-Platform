const express = require('express');
const { body, validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticateToken, isStoreOwner, isAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { Order } = require('../models');
const router = express.Router();

// Initialize Razorpay (only if credentials are available)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a new payment order
 * @access  Private
 */
router.post('/create-order', [
  authenticateToken,
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('amount').isNumeric().withMessage('Valid amount is required'),
  body('currency').optional().isIn(['INR']).withMessage('Currency must be INR'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId, amount, currency = 'INR' } = req.body;

  // Verify order exists and belongs to user
  const order = await Order.findByPk(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.customerId !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to pay for this order' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ message: 'Order is not in pending status' });
  }

  // Check if Razorpay is configured
  if (!razorpay) {
    return res.status(503).json({ message: 'Payment service is not configured' });
  }

  // Create Razorpay order
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt: `order_${orderId}`,
    notes: {
      orderId,
      customerId: req.user.id,
      customerName: req.user.name,
    },
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
}));

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature and update order
 * @access  Private
 */
router.post('/verify', [
  authenticateToken,
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  // Check if Razorpay is configured
  if (!razorpay) {
    return res.status(503).json({ message: 'Payment service is not configured' });
  }

  // Get order details from Razorpay
  try {
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({ message: 'Payment not captured' });
    }

    // Extract order ID from receipt
    const orderId = payment.notes?.orderId;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID not found in payment' });
    }

    // Update order status
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update order with payment details
    await order.update({
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      paymentMethod: 'razorpay',
      paidAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order.id,
      paymentId: razorpay_payment_id,
      amount: payment.amount / 100, // Convert from paise
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
}));

/**
 * @route   POST /api/payments/refund
 * @desc    Process refund for an order
 * @access  Private
 */
router.post('/refund', [
  authenticateToken,
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('reason').notEmpty().withMessage('Refund reason is required'),
  body('amount').optional().isNumeric().withMessage('Valid amount is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId, reason, amount } = req.body;

  // Verify order exists
  const order = await Order.findByPk(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Check authorization
  if (order.customerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (!order.paymentId) {
    return res.status(400).json({ message: 'No payment found for this order' });
  }

  if (order.paymentStatus !== 'paid') {
    return res.status(400).json({ message: 'Order is not paid' });
  }

  // Check if order can be refunded
  if (!order.canBeCancelled()) {
    return res.status(400).json({ message: 'Order cannot be refunded at this stage' });
  }

  const refundAmount = amount || order.total;

  // Check if Razorpay is configured
  if (!razorpay) {
    return res.status(503).json({ message: 'Payment service is not configured' });
  }

  try {
    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(order.paymentId, {
      amount: Math.round(refundAmount * 100), // Convert to paise
      notes: {
        reason,
        orderId: order.id,
        customerId: order.customerId,
      },
    });

    // Update order status
    await order.update({
      status: 'refunded',
      paymentStatus: 'refunded',
      refundId: refund.id,
      refundAmount: refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
}));

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payment details for an order
 * @access  Private
 */
router.get('/order/:orderId', authenticateToken, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findByPk(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Check authorization
  if (order.customerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (!order.paymentId) {
    return res.status(404).json({ message: 'No payment found for this order' });
  }

  // Check if Razorpay is configured
  if (!razorpay) {
    return res.status(503).json({ message: 'Payment service is not configured' });
  }

  try {
    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(order.paymentId);
    
    res.json({
      orderId: order.id,
      paymentId: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      bank: payment.bank,
      card: payment.card,
      wallet: payment.wallet,
      upi: payment.upi,
      vpa: payment.vpa,
      email: payment.email,
      contact: payment.contact,
      createdAt: payment.created_at,
      paidAt: order.paidAt,
    });

  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch payment details' });
  }
}));

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history for user
 * @access  Private
 */
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { customerId: req.user.id };
  if (status) {
    whereClause.paymentStatus = status;
  }

  const orders = await Order.findAndCountAll({
    where: whereClause,
    attributes: [
      'id', 'orderNumber', 'total', 'paymentStatus', 'paymentId',
      'paymentMethod', 'paidAt', 'refundId', 'refundAmount',
      'refundReason', 'refundedAt', 'status', 'createdAt'
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    payments: orders.rows,
    total: orders.count,
    currentPage: parseInt(page),
    totalPages: Math.ceil(orders.count / limit),
  });
}));

/**
 * @route   GET /api/payments/analytics
 * @desc    Get payment analytics (admin only)
 * @access  Private (Admin)
 */
router.get('/analytics', [authenticateToken, isAdmin], asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const whereClause = {};
  if (startDate && endDate) {
    whereClause.createdAt = {
      [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Get payment statistics
  const stats = await Order.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalOrders'],
      [require('sequelize').fn('SUM', require('sequelize').col('total')), 'totalAmount'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN paymentStatus = "paid" THEN 1 END')), 'paidOrders'],
      [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN paymentStatus = "paid" THEN total ELSE 0 END')), 'paidAmount'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN paymentStatus = "refunded" THEN 1 END')), 'refundedOrders'],
      [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN paymentStatus = "refunded" THEN refundAmount ELSE 0 END')), 'refundedAmount'],
    ],
    raw: true,
  });

  // Get payment method distribution
  const paymentMethods = await Order.findAll({
    where: whereClause,
    attributes: [
      'paymentMethod',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('total')), 'amount'],
    ],
    group: ['paymentMethod'],
    raw: true,
  });

  // Get daily payment trends
  const dailyTrends = await Order.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'orders'],
      [require('sequelize').fn('SUM', require('sequelize').col('total')), 'amount'],
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
    raw: true,
  });

  res.json({
    statistics: stats[0],
    paymentMethods,
    dailyTrends,
  });
}));

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhooks
 * @access  Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature) {
    return res.status(400).json({ message: 'Missing signature' });
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = JSON.parse(req.body);

  try {
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'refund.processed':
        await handleRefundProcessed(event.payload.refund.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}));

// Webhook handlers
async function handlePaymentCaptured(payment) {
  const orderId = payment.notes?.orderId;
  if (!orderId) return;

  const order = await Order.findByPk(orderId);
  if (!order) return;

  await order.update({
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentId: payment.id,
    paymentMethod: payment.method,
    paidAt: new Date(),
  });
}

async function handlePaymentFailed(payment) {
  const orderId = payment.notes?.orderId;
  if (!orderId) return;

  const order = await Order.findByPk(orderId);
  if (!order) return;

  await order.update({
    status: 'payment_failed',
    paymentStatus: 'failed',
    paymentId: payment.id,
  });
}

async function handleRefundProcessed(refund) {
  const orderId = refund.notes?.orderId;
  if (!orderId) return;

  const order = await Order.findByPk(orderId);
  if (!order) return;

  await order.update({
    status: 'refunded',
    paymentStatus: 'refunded',
    refundId: refund.id,
    refundAmount: refund.amount / 100,
    refundedAt: new Date(),
  });
}

module.exports = router;
