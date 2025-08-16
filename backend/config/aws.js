const { 
  RDSClient, 
  DescribeDBInstancesCommand,
  CreateDBInstanceCommand 
} = require('@aws-sdk/client-rds');
const { 
  DynamoDBClient, 
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand
} = require('@aws-sdk/client-dynamodb');
const { 
  S3Client, 
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand
} = require('@aws-sdk/client-s3');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');

dotenv.config();

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
};

// Initialize AWS clients
const rdsClient = new RDSClient(awsConfig);
const dynamoClient = new DynamoDBClient(awsConfig);
const s3Client = new S3Client(awsConfig);

// DynamoDB Document Client for easier operations
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

// S3 Configuration
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'bbsr-grocery-storage';
const S3_BUCKET_REGION = process.env.AWS_REGION || 'us-east-1';

// DynamoDB Table Names
const DYNAMODB_TABLES = {
  PRODUCT_CACHE: process.env.DYNAMODB_PRODUCT_CACHE_TABLE || 'product-cache',
  USER_SESSIONS: process.env.DYNAMODB_USER_SESSIONS_TABLE || 'user-sessions',
  ORDER_CACHE: process.env.DYNAMODB_ORDER_CACHE_TABLE || 'order-cache',
  STORE_CACHE: process.env.DYNAMODB_STORE_CACHE_TABLE || 'store-cache'
};

// RDS Configuration
const RDS_CONFIG = {
  DB_INSTANCE_IDENTIFIER: process.env.RDS_DB_INSTANCE_IDENTIFIER || 'bbsr-grocery-db',
  DB_NAME: process.env.DB_NAME || 'bbsr_grocery_db',
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_INSTANCE_CLASS: process.env.RDS_DB_INSTANCE_CLASS || 'db.t3.micro',
  ALLOCATED_STORAGE: parseInt(process.env.RDS_ALLOCATED_STORAGE) || 20,
  ENGINE: 'postgres',
  ENGINE_VERSION: process.env.RDS_ENGINE_VERSION || '14.10',
  VPC_SECURITY_GROUP_IDS: process.env.RDS_VPC_SECURITY_GROUP_IDS ? 
    process.env.RDS_VPC_SECURITY_GROUP_IDS.split(',') : [],
  DB_SUBNET_GROUP_NAME: process.env.RDS_DB_SUBNET_GROUP_NAME,
  PUBLICLY_ACCESSIBLE: process.env.RDS_PUBLICLY_ACCESSIBLE === 'true',
  BACKUP_RETENTION_PERIOD: parseInt(process.env.RDS_BACKUP_RETENTION_PERIOD) || 7,
  MULTI_AZ: process.env.RDS_MULTI_AZ === 'true',
  STORAGE_ENCRYPTED: process.env.RDS_STORAGE_ENCRYPTED === 'true'
};

// Initialize DynamoDB tables
const initializeDynamoDBTables = async () => {
  try {
    console.log('🔄 Initializing DynamoDB tables...');
    
    for (const [tableName, tableConfig] of Object.entries(DYNAMODB_TABLES)) {
      await createTableIfNotExists(tableConfig);
    }
    
    console.log('✅ DynamoDB tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing DynamoDB tables:', error.message);
    // Don't exit process, continue with fallback
  }
};

// Create DynamoDB table if it doesn't exist
const createTableIfNotExists = async (tableName) => {
  try {
    // Check if table exists
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`📋 Table ${tableName} already exists`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      // Table doesn't exist, create it
      const tableParams = getTableParams(tableName);
      await dynamoClient.send(new CreateTableCommand(tableParams));
      console.log(`✅ Created table ${tableName}`);
      
      // Wait for table to be active
      await waitForTableActive(tableName);
    } else {
      throw error;
    }
  }
};

// Get table parameters based on table name
const getTableParams = (tableName) => {
  const baseParams = {
    TableName: tableName,
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [],
    KeySchema: []
  };

  switch (tableName) {
    case DYNAMODB_TABLES.PRODUCT_CACHE:
      return {
        ...baseParams,
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'category', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'CategoryIndex',
            KeySchema: [
              { AttributeName: 'category', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      };
    
    case DYNAMODB_TABLES.USER_SESSIONS:
      return {
        ...baseParams,
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'sessionId', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'sessionId', KeyType: 'RANGE' }
        ],
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      };
    
    case DYNAMODB_TABLES.ORDER_CACHE:
      return {
        ...baseParams,
        AttributeDefinitions: [
          { AttributeName: 'orderId', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'orderId', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'UserIndex',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      };
    
    case DYNAMODB_TABLES.STORE_CACHE:
      return {
        ...baseParams,
        AttributeDefinitions: [
          { AttributeName: 'storeId', AttributeType: 'S' },
          { AttributeName: 'location', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'storeId', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'LocationIndex',
            KeySchema: [
              { AttributeName: 'location', KeyType: 'HASH' }
            ],
            Projection: { ProjectionType: 'ALL' }
          }
        ]
      };
    
    default:
      return baseParams;
  }
};

// Wait for table to be active
const waitForTableActive = async (tableName) => {
  let tableStatus = 'CREATING';
  while (tableStatus === 'CREATING') {
    try {
      const response = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      tableStatus = response.Table.TableStatus;
      
      if (tableStatus === 'ACTIVE') {
        console.log(`✅ Table ${tableName} is now active`);
        break;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error checking table status for ${tableName}:`, error.message);
      break;
    }
  }
};

// Check RDS connection
const checkRDSConnection = async () => {
  try {
    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: RDS_CONFIG.DB_INSTANCE_IDENTIFIER
    });
    
    const response = await rdsClient.send(command);
    const dbInstance = response.DBInstances[0];
    
    if (dbInstance) {
      console.log(`✅ RDS instance ${dbInstance.DBInstanceIdentifier} is ${dbInstance.DBInstanceStatus}`);
      return {
        status: dbInstance.DBInstanceStatus,
        endpoint: dbInstance.Endpoint?.Address,
        port: dbInstance.Endpoint?.Port
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error checking RDS connection:', error.message);
    return null;
  }
};

// Check S3 bucket access
const checkS3Access = async () => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      MaxKeys: 1
    });
    
    await s3Client.send(command);
    console.log(`✅ S3 bucket ${S3_BUCKET_NAME} is accessible`);
    return true;
  } catch (error) {
    console.error(`❌ Error accessing S3 bucket ${S3_BUCKET_NAME}:`, error.message);
    return false;
  }
};

// Initialize AWS services
const initializeAWS = async () => {
  try {
    console.log('🚀 Initializing AWS services...');
    
    // Check environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️ AWS credentials not found. Some features may not work.');
      return false;
    }
    
    // Initialize DynamoDB tables
    await initializeDynamoDBTables();
    
    // Check RDS connection
    const rdsStatus = await checkRDSConnection();
    
    // Check S3 access
    const s3Status = await checkS3Access();
    
    if (rdsStatus && s3Status) {
      console.log('✅ All AWS services are accessible');
      return true;
    } else {
      console.warn('⚠️ Some AWS services are not accessible. Using fallback mode.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error initializing AWS services:', error.message);
    return false;
  }
};

module.exports = {
  // AWS Clients
  rdsClient,
  dynamoClient,
  dynamoDocClient,
  s3Client,
  
  // Configuration
  awsConfig,
  S3_BUCKET_NAME,
  S3_BUCKET_REGION,
  DYNAMODB_TABLES,
  RDS_CONFIG,
  
  // Functions
  initializeAWS,
  checkRDSConnection,
  checkS3Access,
  
  // DynamoDB Operations
  createTableIfNotExists,
  
  // Commands for re-export
  RDSClient,
  DynamoDBClient,
  S3Client,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  getSignedUrl
};
