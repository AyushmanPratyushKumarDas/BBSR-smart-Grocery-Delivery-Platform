# AWS Integration Setup Guide

This guide explains how to set up and configure Amazon RDS (PostgreSQL), DynamoDB, and S3 for the BBSR Grocery Delivery Platform.

## Prerequisites

1. AWS Account with appropriate permissions
2. Node.js and npm installed
3. PostgreSQL client tools (for local development)

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Application Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration (PostgreSQL)
DB_NAME=bbsr_grocery_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# Amazon RDS Configuration
RDS_DB_INSTANCE_IDENTIFIER=bbsr-grocery-db
RDS_DB_INSTANCE_CLASS=db.t3.micro
RDS_ALLOCATED_STORAGE=20
RDS_ENGINE_VERSION=14.10
RDS_VPC_SECURITY_GROUP_IDS=sg-xxxxxxxxx
RDS_DB_SUBNET_GROUP_NAME=your-subnet-group
RDS_PUBLICLY_ACCESSIBLE=true
RDS_BACKUP_RETENTION_PERIOD=7
RDS_MULTI_AZ=false
RDS_STORAGE_ENCRYPTED=true

# Amazon S3 Configuration
S3_BUCKET_NAME=bbsr-grocery-storage
S3_BUCKET_REGION=us-east-1

# DynamoDB Table Names (optional - will use defaults if not set)
DYNAMODB_PRODUCT_CACHE_TABLE=product-cache
DYNAMODB_USER_SESSIONS_TABLE=user-sessions
DYNAMODB_ORDER_CACHE_TABLE=order-cache
DYNAMODB_STORE_CACHE_TABLE=store-cache

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## AWS Service Setup

### 1. Amazon RDS (PostgreSQL)

1. **Create RDS Instance:**
   - Go to AWS RDS Console
   - Click "Create database"
   - Choose "Standard create"
   - Select "PostgreSQL" as engine
   - Choose "Free tier" or "Production" template
   - Set instance identifier: `bbsr-grocery-db`
   - Set master username and password
   - Choose instance class (t3.micro for free tier)
   - Set storage to 20 GB
   - Configure VPC and security groups

2. **Security Group Configuration:**
   - Create a security group for RDS
   - Add inbound rule: PostgreSQL (5432) from your application's security group
   - Ensure outbound rules allow all traffic

3. **Subnet Group:**
   - Create a DB subnet group in your VPC
   - Include at least 2 subnets in different availability zones

### 2. Amazon S3

1. **Create S3 Bucket:**
   - Go to S3 Console
   - Click "Create bucket"
   - Set bucket name: `bbsr-grocery-storage`
   - Choose region (same as RDS)
   - Uncheck "Block all public access" (for public image access)
   - Enable versioning (optional)
   - Enable server-side encryption

2. **Bucket Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::bbsr-grocery-storage/*"
       }
     ]
   }
   ```

3. **CORS Configuration:**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### 3. Amazon DynamoDB

1. **Create Tables:**
   - The application will automatically create required tables
   - Tables will be created with pay-per-request billing
   - No manual setup required

2. **IAM Permissions:**
   - Ensure your AWS user has DynamoDB permissions:
     - `dynamodb:CreateTable`
     - `dynamodb:PutItem`
     - `dynamodb:GetItem`
     - `dynamodb:Query`
     - `dynamodb:Scan`
     - `dynamodb:UpdateItem`
     - `dynamodb:DeleteItem`

## Installation and Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 3. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Service Architecture

### Database Layer
- **Primary**: Amazon RDS PostgreSQL
- **Fallback**: Local PostgreSQL
- **Development Fallback**: SQLite

### Caching Layer
- **Primary**: Amazon DynamoDB
- **Tables**:
  - `product-cache`: Product data caching
  - `store-cache`: Store data caching
  - `order-cache`: Order data caching
  - `user-sessions`: User session management

### Storage Layer
- **Primary**: Amazon S3
- **Fallback**: Base64 encoding in database
- **Features**:
  - Image optimization
  - Public access URLs
  - Automatic cleanup

## Monitoring and Health Checks

### Health Endpoints
- `/health` - Overall system health
- `/api/status` - Detailed service status

### Console Logging
The application provides comprehensive logging:
- ✅ Success operations
- ⚠️ Warnings and fallbacks
- ❌ Errors and failures
- 🔄 Processing operations
- 📊 Data source information

## Fallback Strategy

### When AWS Services Are Unavailable
1. **Database**: Falls back to local PostgreSQL or SQLite
2. **Caching**: Continues without caching
3. **Storage**: Uses base64 encoding for images
4. **Frontend**: Automatically uses demo data

### Error Handling
- All API calls have fallback mechanisms
- Console logs show when fallbacks are used
- Graceful degradation ensures application continues to work

## Performance Optimization

### Caching Strategy
- **Product Cache**: 24-hour TTL
- **Store Cache**: 24-hour TTL
- **Order Cache**: 7-day TTL
- **User Sessions**: 2-hour TTL

### Database Optimization
- Connection pooling
- Query optimization
- Index management
- Prepared statements

## Security Considerations

### AWS Security
- IAM roles with minimal permissions
- VPC isolation for RDS
- S3 bucket policies
- Encryption at rest and in transit

### Application Security
- JWT authentication
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## Troubleshooting

### Common Issues

1. **RDS Connection Failed**
   - Check security group rules
   - Verify VPC configuration
   - Ensure credentials are correct

2. **S3 Upload Failed**
   - Check bucket permissions
   - Verify CORS configuration
   - Check IAM permissions

3. **DynamoDB Table Creation Failed**
   - Verify IAM permissions
   - Check region configuration
   - Ensure table names are valid

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=app:*
NODE_ENV=development
```

## Production Deployment

### Environment Variables
- Use strong, unique passwords
- Enable SSL for RDS
- Use IAM roles instead of access keys
- Enable CloudWatch monitoring

### Scaling
- RDS: Enable Multi-AZ for high availability
- S3: Use CloudFront for global distribution
- DynamoDB: Enable auto-scaling for production loads

## Support

For issues and questions:
1. Check console logs for detailed error information
2. Verify AWS service status
3. Check environment variable configuration
4. Review IAM permissions

## Cost Optimization

### Free Tier
- RDS: 750 hours/month of db.t3.micro
- S3: 5 GB storage, 20,000 GET requests
- DynamoDB: 25 GB storage, 25 WCU/25 RCU

### Production Costs
- RDS: ~$15-50/month depending on instance size
- S3: ~$0.023/GB/month
- DynamoDB: Pay-per-request or provisioned capacity
