# 🚀 Quick Start Guide - BBSR Grocery Delivery Platform

## ⚡ **Get Running in 5 Minutes**

### **1. Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create your .env file with your actual AWS credentials
cat > .env << 'EOF'
# Application Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration (PostgreSQL)
DB_NAME=bbsr_grocery_db
DB_USER=postgres
DB_PASSWORD=Arpit1234*!
DB_HOST=database-1.c5yiaiqoe8j4.ap-southeast-2.rds.amazonaws.com
DB_PORT=5432
DB_DIALECT=postgres

# AWS Configuration
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=714768746996
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=24h

# Start the server
npm start
EOF

# Edit the .env file to add your actual AWS_SECRET_ACCESS_KEY
# Then start the server
npm start
```

### **2. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Create your .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_DEV_SERVER_PORT=5173
EOF

# Start the development server
npm run dev
```

### **3. Test Everything**
1. **Backend**: Should show "🚀 BBSR Grocery Delivery API running on port 5000"
2. **Frontend**: Should open at `http://localhost:5173`
3. **Database**: Should connect to your AWS RDS instance
4. **Health Check**: Visit `http://localhost:5000/health`

## 🔧 **If Something Goes Wrong**

### **Database Connection Issues**
```bash
# Test your RDS connection
psql -h database-1.c5yiaiqoe8j4.ap-southeast-2.rds.amazonaws.com -U postgres -d bbsr_grocery_db
# Enter password: Arpit1234*!
```

### **Port Issues**
- **Backend**: Port 5000
- **Frontend**: Port 5173
- **Database**: Port 5432 (AWS RDS)

### **CORS Issues**
- Frontend runs on `http://localhost:5173`
- Backend expects requests from `http://localhost:5173`
- Make sure both are running

## 🎯 **Success Indicators**

✅ Backend starts without errors  
✅ Database connects to AWS RDS  
✅ Frontend opens at `http://localhost:5173`  
✅ You can register/login users  
✅ Products and stores load correctly  

## 🚨 **Important Notes**

1. **AWS Credentials**: You need to add your `AWS_SECRET_ACCESS_KEY` to the `.env` file
2. **Security Groups**: Make sure your RDS security group allows connections from your IP
3. **Database**: Run `random.sql` and `inserts.sql` to set up your schema and sample data
4. **JWT Secret**: Change the JWT secret in production

## 📞 **Need Help?**

1. Check console logs for error messages
2. Verify your AWS credentials
3. Ensure your RDS instance is running
4. Test database connection manually

Your platform is ready to go! 🎉
