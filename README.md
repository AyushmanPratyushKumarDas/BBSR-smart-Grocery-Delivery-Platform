# BBSR Smart Grocery Delivery Platform - Backend

A comprehensive cloud-based grocery delivery management system built with Express.js, PostgreSQL (Amazon RDS), and Razorpay payment integration.

## 🚀 Features

### Core Functionality
- **Real-time Order Management** - Complete order lifecycle from creation to delivery
- **Multi-role Authentication** - Customer, Store Owner, Delivery Partner, and Admin roles
- **Inventory Management** - Live stock updates and synchronization
- **Route Optimization** - AI-based delivery route optimization with GPS tracking
- **Payment Processing** - Secure Razorpay integration with webhook support
- **Real-time Tracking** - Socket.io powered live order tracking
- **Analytics Dashboard** - Comprehensive business intelligence and reporting

### Technical Features
- **RESTful API** - Well-structured endpoints with proper HTTP status codes
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Express-validator for request validation
- **Error Handling** - Centralized error handling with proper logging
- **File Upload** - Multer + Cloudinary for image management
- **Rate Limiting** - Protection against abuse
- **Security Headers** - Helmet for security
- **Compression** - Response compression for better performance

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Amazon RDS)
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Razorpay
- **File Storage**: Cloudinary
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Security**: helmet, cors, bcryptjs
- **Utilities**: moment, geolib, uuid, nodemailer

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling middleware
├── models/
│   ├── index.js            # Model associations
│   ├── User.js             # User model
│   ├── Store.js            # Store model
│   ├── Product.js          # Product model
│   └── Order.js            # Order model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management routes
│   ├── stores.js           # Store management routes
│   ├── products.js         # Product management routes
│   ├── orders.js           # Order management routes
│   ├── delivery.js         # Delivery partner routes
│   ├── payments.js         # Payment processing routes
│   └── analytics.js        # Analytics and reporting routes
├── package.json            # Dependencies and scripts
└── server.js              # Main application file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (Amazon RDS recommended)
- Razorpay account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project_devops/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration (Amazon RDS)
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email Configuration (for password reset)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+919876543210",
  "role": "customer"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Store Management

#### Get All Stores
```http
GET /api/stores?category=grocery&search=supermarket&lat=20.2961&lng=85.8245&radius=5
```

#### Create Store (Store Owner)
```http
POST /api/stores
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fresh Grocery Store",
  "description": "Best grocery store in Bhubaneswar",
  "category": "grocery",
  "address": {
    "street": "123 Main Street",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "pincode": "751001"
  },
  "coordinates": {
    "lat": 20.2961,
    "lng": 85.8245
  },
  "operatingHours": {
    "monday": {"open": "08:00", "close": "22:00"},
    "tuesday": {"open": "08:00", "close": "22:00"}
  }
}
```

### Product Management

#### Get Products
```http
GET /api/products?storeId=uuid&category=fruits&minPrice=10&maxPrice=100&inStock=true
```

#### Create Product (Store Owner)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fresh Apples",
  "description": "Sweet and juicy red apples",
  "price": 120.00,
  "stock": 50,
  "category": "fruits",
  "storeId": "store-uuid",
  "images": ["image1.jpg", "image2.jpg"],
  "nutritionalInfo": {
    "calories": 52,
    "protein": "0.3g",
    "fiber": "2.4g"
  }
}
```

### Order Management

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeId": "store-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "price": 120.00
    }
  ],
  "deliveryAddress": {
    "street": "456 Customer Street",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "pincode": "751002"
  },
  "deliveryInstructions": "Please deliver at gate"
}
```

#### Get Order Status
```http
GET /api/orders/order-uuid
Authorization: Bearer <token>
```

### Payment Processing

#### Create Payment Order
```http
POST /api/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-uuid",
  "amount": 240.00,
  "currency": "INR"
}
```

#### Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Analytics

#### Dashboard Analytics
```http
GET /api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Sales Analytics
```http
GET /api/analytics/sales?period=monthly&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

## 🔐 Authentication & Authorization

### User Roles
- **customer**: Can place orders, track deliveries, manage profile
- **store_owner**: Can manage stores, products, view store analytics
- **delivery_partner**: Can accept deliveries, update status, view earnings
- **admin**: Full system access, analytics, user management

### JWT Token
Include the JWT token in the Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

## 💳 Payment Integration

### Razorpay Setup
1. Create a Razorpay account
2. Get your API keys from the dashboard
3. Configure webhook URL: `https://your-domain.com/api/payments/webhook`
4. Add webhook secret to environment variables

### Payment Flow
1. Create order → Get Razorpay order ID
2. Process payment on frontend using Razorpay SDK
3. Verify payment signature on backend
4. Update order status to confirmed

## 📊 Analytics Features

### Dashboard Analytics
- Total stores, products, customers, delivery partners
- Order statistics and revenue metrics
- Recent orders and top performing stores

### Sales Analytics
- Time-based sales data (daily, weekly, monthly, yearly)
- Revenue growth calculations
- Order completion and cancellation rates

### Product Analytics
- Top selling products
- Low stock alerts
- Category performance analysis

### Customer Analytics
- Customer registration trends
- Top customers by order value
- Customer segmentation (New, Regular, Frequent, VIP)
- Retention rate calculations

### Delivery Analytics
- Delivery performance metrics
- Top delivery partners
- Delivery time distribution

### Revenue Analytics
- Gross and net revenue tracking
- Commission calculations
- Delivery revenue analysis

## 🔧 Configuration

### Database Configuration
The system is configured for Amazon RDS PostgreSQL with:
- Connection pooling
- SSL support for production
- Automatic reconnection
- Query logging in development

### Security Features
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet security headers
- Input validation and sanitization
- JWT token expiration
- Password hashing with bcrypt

### File Upload
- Multer for handling multipart/form-data
- Cloudinary for cloud storage
- Image optimization and transformation
- Secure file validation

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000

# Database (Amazon RDS)
DB_HOST=your-production-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=production_db
DB_USER=production_user
DB_PASSWORD=secure_password

# Security
JWT_SECRET=very_secure_jwt_secret
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=live_secret_xxx
RAZORPAY_WEBHOOK_SECRET=webhook_secret_xxx

# Frontend
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Steps
1. Set up Amazon RDS PostgreSQL instance
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (AWS, Heroku, etc.)
5. Set up SSL certificate
6. Configure domain and DNS

## 🧪 Testing

### Health Check
```http
GET /health
```

### API Testing
Use tools like Postman or curl to test the endpoints. All endpoints return proper HTTP status codes and JSON responses.

## 📝 Error Handling

The API uses centralized error handling with:
- Proper HTTP status codes
- Descriptive error messages
- Error logging
- Validation error details

## 🔄 Real-time Features

### Socket.io Events
- `join-delivery`: Join delivery tracking room
- `order-status-update`: Update order status
- `status-updated`: Receive status updates

### WebSocket Connection
```javascript
const socket = io('http://localhost:5000');
socket.emit('join-delivery', orderId);
socket.on('status-updated', (data) => {
  console.log('Order status updated:', data);
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔮 Future Enhancements

- **AI-powered recommendations** - Product suggestions based on user behavior
- **Advanced route optimization** - Machine learning for delivery routes
- **Multi-language support** - Internationalization
- **Push notifications** - Real-time order updates
- **Advanced analytics** - Predictive analytics and insights
- **Mobile app APIs** - Native mobile application support
