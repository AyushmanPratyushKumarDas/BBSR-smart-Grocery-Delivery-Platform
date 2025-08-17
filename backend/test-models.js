const { Sequelize } = require('sequelize');
const initializeModels = require('./models');

// Test database connection and models
async function testModels() {
  try {
    console.log('🧪 Testing Models...');
    
    // Create a test sequelize instance
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });
    
    // Initialize models
    const models = initializeModels(sequelize);
    console.log('✅ Models initialized successfully');
    console.log('📋 Available models:', Object.keys(models));
    
    // Test User model
    console.log('\n👤 Testing User Model...');
    const testUser = models.User.build({
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210',
      password_hash: 'testpassword',
      role: 'customer'
    });
    console.log('✅ User model created:', testUser.toJSON());
    
    // Test Store model
    console.log('\n🏪 Testing Store Model...');
    const testStore = models.Store.build({
      name: 'Test Store',
      description: 'A test store',
      owner_id: 1,
      category: 'grocery',
      location: 'Test Location',
      address: { street: 'Test Street', city: 'Test City' },
      coordinates: { lat: 12.9716, lng: 77.5946 },
      phone: '9876543210',
      operating_hours: { monday: { open: '08:00', close: '22:00', isOpen: true } }
    });
    console.log('✅ Store model created:', testStore.toJSON());
    
    // Test Product model
    console.log('\n📦 Testing Product Model...');
    const testProduct = models.Product.build({
      name: 'Test Product',
      description: 'A test product',
      category_id: 1,
      store_id: 1,
      sku: 'TEST001',
      price: 99.99,
      stock: 100,
      unit: 'piece'
    });
    console.log('✅ Product model created:', testProduct.toJSON());
    
    // Test Order model
    console.log('\n📋 Testing Order Model...');
    const testOrder = models.Order.build({
      order_number: 'ORD-001',
      user_id: 1,
      store_id: 1,
      items: [{ product_id: 1, quantity: 2, price: 99.99 }],
      subtotal: 199.98,
      total: 199.98,
      delivery_address: { street: 'Test Street', city: 'Test City' }
    });
    console.log('✅ Order model created:', testOrder.toJSON());
    
    // Test Category model
    console.log('\n🏷️ Testing Category Model...');
    const testCategory = models.Category.build({
      name: 'Test Category',
      description: 'A test category',
      is_active: true
    });
    console.log('✅ Category model created:', testCategory.toJSON());
    
    console.log('\n🎉 All models tested successfully!');
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testModels();
