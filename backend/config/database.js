const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const { initializeAWS, checkRDSConnection } = require('./aws');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Database configuration for Amazon RDS PostgreSQL with fallback
let sequelize = null;
let isAWSConnected = false;

// Debug flag to track initialization
let isInitialized = false;

// Initialize a fallback SQLite connection for development
const createFallbackConnection = () => {
  try {
    const fallbackSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './dev-database.sqlite',
      logging: false
    });
    console.log('✅ SQLite fallback connection created');
    return fallbackSequelize;
  } catch (error) {
    console.error('❌ Failed to create SQLite fallback:', error.message);
    return null;
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  try {
    // First try to connect to AWS RDS
    console.log('🔄 Attempting to connect to AWS RDS...');
    
    // Initialize AWS services
    isAWSConnected = await initializeAWS();
    
    if (isAWSConnected) {
      // Try to get RDS endpoint
      const rdsStatus = await checkRDSConnection();
      
      if (rdsStatus && rdsStatus.endpoint) {
        console.log(`✅ Connecting to AWS RDS at ${rdsStatus.endpoint}:${rdsStatus.port}`);
        
        sequelize = new Sequelize(
          process.env.DB_NAME || 'bbsr_grocery_db',
          process.env.DB_USERNAME || 'postgres',
          process.env.DB_PASSWORD,
          {
            host: rdsStatus.endpoint,
            port: rdsStatus.port || 5432,
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
              max: 20,
              min: 0,
              acquire: 30000,
              idle: 10000
            },
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: false
              }
            }
          }
        );
        
        // Test RDS connection
        await sequelize.authenticate();
        console.log('✅ AWS RDS PostgreSQL database connected successfully');
        return true;
      }
    }
    
    // Fallback to local database or environment variables
    console.log('⚠️ Falling back to local/configured database...');
    
    // Debug database connection parameters
    console.log('Database Connection Parameters:');
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_USERNAME:', process.env.DB_USERNAME);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    
    sequelize = new Sequelize(
      process.env.DB_NAME || 'bbsr_grocery_db',
      process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 20,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );
    
    // Test local database connection
    await sequelize.authenticate();
    console.log('✅ Local PostgreSQL database connected successfully');
    return false;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Try to create a minimal connection for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Attempting to create minimal development connection...');
      
      try {
        sequelize = createFallbackConnection();
        if (sequelize) {
          await sequelize.authenticate();
          console.log('✅ SQLite development database connected (fallback mode)');
          return false;
        }
      } catch (sqliteError) {
        console.error('❌ SQLite fallback also failed:', sqliteError.message);
      }
    }
    
    // If all else fails, create a minimal SQLite connection to prevent crashes
    console.log('🔄 Creating minimal SQLite connection to prevent crashes...');
    sequelize = createFallbackConnection();
    
    if (!sequelize) {
      console.error('🚨 Application cannot start without database connection');
      process.exit(1);
    }
    
    return false;
  }
};

// Test database connection
const connectDB = async () => {
  try {
    await initializeDatabase();
    
    // Check if sequelize is available after initialization
    if (!sequelize) {
      console.error('❌ Sequelize instance is still null after initialization');
      throw new Error('Failed to initialize Sequelize instance');
    }
    
    // Sync all models (in development)
    if (process.env.NODE_ENV === 'development' && sequelize) {
      await sequelize.sync({ alter: true });
      console.log('🔄 Database models synchronized');
    }
    
    isInitialized = true;
    console.log('✅ Database connection fully established and ready');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Get database status
const getDatabaseStatus = () => {
  return {
    isAWSConnected,
    dialect: sequelize?.getDialect(),
    host: sequelize?.config?.host,
    port: sequelize?.config?.port,
    database: sequelize?.config?.database,
    isConnected: sequelize?.authenticate ? true : false
  };
};

// Health check for database
const checkDatabaseHealth = async () => {
  try {
    if (sequelize) {
      await sequelize.authenticate();
      return {
        status: 'healthy',
        message: 'Database connection is working',
        timestamp: new Date().toISOString(),
        ...getDatabaseStatus()
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Database not initialized',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

module.exports = { 
  get sequelize() {
    // Only return sequelize if it's properly initialized
    if (!sequelize) {
      console.warn('⚠️ Attempted to access sequelize before initialization');
    }
    return sequelize;
  },
  connectDB, 
  getDatabaseStatus, 
  checkDatabaseHealth,
  isAWSConnected,
  isInitialized
};

