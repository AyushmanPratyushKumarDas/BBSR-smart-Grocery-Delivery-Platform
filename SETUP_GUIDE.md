# 🚀 AWS Integration Setup & Testing Guide

## 📋 Prerequisites
- Node.js and npm installed
- AWS account (optional for testing - fallback will work)
- PostgreSQL (optional - SQLite fallback will work)

## 🔧 Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
Create a `.env` file in the `backend` directory with this content:

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

# AWS Configuration (optional for testing)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=24h

# Other configurations...
```

**Note:** If you don't have AWS credentials, the system will automatically fall back to local services and demo data.

### 3. Start Backend Server
```bash
npm run dev
```

You should see:
- ✅ Database connected (PostgreSQL/SQLite)
- ⚠️ AWS services not connected (fallback mode)
- 🚀 Server running on port 5000

## 🌐 Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Frontend
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🧪 Testing the Integration

### 1. Open the Homepage
Navigate to `http://localhost:3000` - you'll see the API Test Component at the bottom.

### 2. Test API Health
- Click "Test Products API" to test the backend connection
- Check the browser console (F12) for detailed logs
- Watch for fallback indicators

### 3. Console Monitoring
Open Developer Console (F12) to see:
- 🌐 API Request details
- ✅ Successful responses with data source
- ⚠️ Fallback to demo data when API fails
- ❌ Error details and status codes

## 📊 Expected Behavior

### When Backend is Running:
- ✅ API calls succeed
- 📊 Data source shows "PostgreSQL Database" or "DynamoDB Cache"
- 🏥 Health check shows "OK"

### When Backend is Down:
- ⚠️ API calls fail
- 📊 Data source shows "Demo Data (Fallback)"
- 🏥 Health check shows "ERROR"
- 🎯 App continues working with demo data

### When AWS Services are Available:
- ☁️ DynamoDB caching works
- 🪣 S3 file uploads work
- 🗄️ RDS database connection works

## 🔍 Testing Scenarios

### Scenario 1: Backend Running, No AWS
1. Start backend server
2. Test API calls
3. Should see database responses
4. Console shows "database" as source

### Scenario 2: Backend Down
1. Stop backend server
2. Test API calls
3. Should see demo data
4. Console shows "demo" as source

### Scenario 3: Full AWS Integration
1. Configure AWS credentials in `.env`
2. Start backend server
3. Should see AWS services connected
4. Console shows "cache" or "database" as source

## 🐛 Troubleshooting

### Common Issues:

1. **Backend won't start:**
   - Check if port 5000 is available
   - Verify `.env` file exists
   - Check console for error messages

2. **Database connection failed:**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - System will fall back to SQLite

3. **Frontend shows no data:**
   - Check browser console for errors
   - Verify backend is running
   - Check network tab for failed requests

4. **AWS services not working:**
   - Verify AWS credentials in `.env`
   - Check AWS service status
   - System will work without AWS (fallback mode)

## 📱 Testing Commands

### Backend Health Check:
```bash
curl http://localhost:5000/health
```

### API Status:
```bash
curl http://localhost:5000/api/status
```

### Test Products API:
```bash
curl http://localhost:5000/api/products
```

## 🎯 Success Indicators

✅ **Backend Running:**
- Server starts without errors
- Health check returns 200 OK
- Console shows service status

✅ **Frontend Working:**
- Page loads without errors
- API test component displays
- Console shows request/response logs

✅ **Fallback Working:**
- Demo data displays when API fails
- Console shows fallback indicators
- App continues functioning

## 🚀 Next Steps

1. **Test basic functionality** with current setup
2. **Configure AWS services** if needed
3. **Test different scenarios** (backend up/down)
4. **Monitor console logs** for debugging
5. **Verify fallback mechanisms** work correctly

## 📞 Support

If you encounter issues:
1. Check console logs for error details
2. Verify environment configuration
3. Test individual components
4. Check network connectivity

The system is designed to be resilient and will always fall back to working alternatives when services are unavailable.
