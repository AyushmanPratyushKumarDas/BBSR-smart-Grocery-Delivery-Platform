const User = require('./User');
const Store = require('./Store');
const Product = require('./Product');
const Order = require('./Order');

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

module.exports = {
  User,
  Store,
  Product,
  Order
};
