const defineUser = require('./User.model');
const defineStore = require('./Store.model');
const defineProduct = require('./Product.model');
const defineOrder = require('./Order.model');

// Function to initialize all models with sequelize instance
const initializeModels = (sequelize) => {
  // Define models
  const User = defineUser(sequelize);
  const Store = defineStore(sequelize);
  const Product = defineProduct(sequelize);
  const Order = defineOrder(sequelize);

  // User associations
  User.hasMany(Store, { foreignKey: 'ownerId', as: 'stores' });
  User.hasMany(Order, { foreignKey: 'customerId', as: 'customerOrders' });
  User.hasMany(Order, { foreignKey: 'deliveryPartnerId', as: 'deliveryOrders' });

  // Store associations
  Store.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
  Store.hasMany(Product, { foreignKey: 'storeId', as: 'products' });
  Store.hasMany(Order, { foreignKey: 'storeId', as: 'orders' });

  // Product associations
  Product.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });

  // Order associations
  Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
  Order.belongsTo(User, { foreignKey: 'deliveryPartnerId', as: 'deliveryPartner' });
  Order.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });

  return {
    User,
    Store,
    Product,
    Order
  };
};

module.exports = initializeModels;
