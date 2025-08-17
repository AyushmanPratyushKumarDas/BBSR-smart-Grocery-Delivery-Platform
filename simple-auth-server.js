const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = 3001; // Using different port to avoid conflicts
const JWT_SECRET = 'your-secret-key-change-in-production';

// Database setup
const dbPath = path.join(__dirname, 'simple-auth.db');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*",
  credentials: true
}));

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )
  `);
});

// Validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['customer', 'store_owner', 'delivery_partner'])
    .withMessage('Invalid role')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper functions
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Simple Auth Server is running',
    timestamp: new Date().toISOString()
  });
});

// User Registration
app.post('/api/auth/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, password, role = 'customer' } = req.body;

    // Check if user already exists
    db.get(
      "SELECT * FROM users WHERE email = ? OR phone = ?",
      [email, phone],
      async (err, existingUser) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Internal server error'
          });
        }

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'User with this email or phone already exists'
          });
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        
        db.run(
          "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
          [name, email, phone, passwordHash, role],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                success: false,
                message: 'Failed to create user'
              });
            }

            // Generate token
            const token = generateToken(this.lastID);

            // Get the created user (without password)
            db.get(
              "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
              [this.lastID],
              (err, user) => {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({
                    success: false,
                    message: 'User created but failed to retrieve details'
                  });
                }

                res.status(201).json({
                  success: true,
                  message: 'User registered successfully',
                  data: {
                    user,
                    token
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Login
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Internal server error'
          });
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Check if user is active
        if (!user.is_active) {
          return res.status(401).json({
            success: false,
            message: 'Account is deactivated'
          });
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Generate token
        const token = generateToken(user.id);

        // Return user data (without password)
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: userWithoutPassword,
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (for testing purposes)
app.get('/api/auth/users', (req, res) => {
  db.all(
    "SELECT id, name, email, phone, role, created_at FROM users",
    [],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch users'
        });
      }

      res.json({
        success: true,
        data: {
          users,
          count: users.length
        }
      });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Simple Auth Server started successfully!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 All users: http://localhost:${PORT}/api/auth/users`);
  console.log('');
  console.log('📚 Available endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/users`);
  console.log('');
  console.log('🗄️ Database: simple-auth.db (SQLite)');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
  });
  process.exit(0);
});
