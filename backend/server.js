const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { connectDB, checkDatabaseHealth, getDatabaseStatus } = require('./config/database');
const { initializeAWS, checkRDSConnection, checkS3Access } = require('./config/aws');
const socketIo = require('socket.io');
const http = require('http');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/stores');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { authenticateToken } = require('./middleware/auth.middleware');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize services
let awsStatus = false;
let databaseStatus = false;

// Connect to database and AWS services
const initializeServices = async () => {
  try {
    console.log('🚀 Initializing BBSR Grocery Delivery Platform...');
    
    // Initialize database
    databaseStatus = await connectDB();
    
    // Initialize AWS services
    awsStatus = await initializeAWS();
    
    console.log('✅ Services initialized successfully');
    console.log(`📊 Database Status: ${databaseStatus ? 'Connected' : 'Fallback Mode'}`);
    console.log(`☁️ AWS Status: ${awsStatus ? 'Connected' : 'Fallback Mode'}`);
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    console.log('⚠️ Continuing with fallback mode...');
  }
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const rdsStatus = awsStatus ? await checkRDSConnection() : null;
    const s3Status = awsStatus ? await checkS3Access() : null;
    
    const healthStatus = {
      status: 'OK',
      message: 'BBSR Grocery Delivery API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbHealth,
        aws: {
          connected: awsStatus,
          rds: rdsStatus,
          s3: s3Status
        }
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };
    
    // Determine overall health status
    const isHealthy = dbHealth.status === 'healthy';
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
    // Log health status
    console.log(`🏥 Health Check - Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Database: ${dbHealth.status}`);
    console.log(`   AWS: ${awsStatus ? 'Connected' : 'Not Connected'}`);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Service status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      database: getDatabaseStatus(),
      aws: {
        connected: awsStatus,
        rds: awsStatus ? await checkRDSConnection() : null,
        s3: awsStatus ? await checkS3Access() : null
      },
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      success: true,
      data: status
    });
    
    // Log status
    console.log('📊 Service Status Check:');
    console.log(`   Database: ${status.database.dialect} at ${status.database.host}:${status.database.port}`);
    console.log(`   AWS RDS: ${status.aws.rds ? 'Connected' : 'Not Available'}`);
    console.log(`   AWS S3: ${status.aws.s3 ? 'Accessible' : 'Not Accessible'}`);
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/delivery', authenticateToken, deliveryRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Join delivery tracking room
  socket.on('join-delivery', (orderId) => {
    socket.join(`delivery-${orderId}`);
    console.log(`📦 Client joined delivery room: ${orderId}`);
  });

  // Handle order status updates
  socket.on('order-status-update', (data) => {
    io.to(`delivery-${data.orderId}`).emit('status-updated', data);
    console.log(`🔄 Order status updated: ${data.orderId} -> ${data.status}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Initialize services first
    await initializeServices();
    
    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 BBSR Grocery Delivery API running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Status check: http://localhost:${PORT}/api/status`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      
      // Log final status
      console.log('\n📋 Final Service Status:');
      console.log(`   Database: ${databaseStatus ? '✅ Connected' : '⚠️ Fallback Mode'}`);
      console.log(`   AWS Services: ${awsStatus ? '✅ Connected' : '⚠️ Fallback Mode'}`);
      console.log(`   Socket.IO: ✅ Active`);
      console.log(`   Rate Limiting: ✅ Active`);
      console.log(`   Security: ✅ Active`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, io };

