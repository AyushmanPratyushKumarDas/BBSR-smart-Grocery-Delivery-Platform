const defineUser = require('./User.model');
const defineStore = require('./Store.model');
const defineProduct = require('./Product.model');
const defineOrder = require('./Order.model');
const defineCategory = require('./Category.model');

// Function to initialize all models with sequelize instance
const initializeModels = (sequelize) => {
  // Define models
  const User = defineUser(sequelize);
  const Store = defineStore(sequelize);
  const Product = defineProduct(sequelize);
  const Order = defineOrder(sequelize);
  const Category = defineCategory(sequelize);

  // User associations
  User.hasMany(Store, { foreignKey: 'owner_id', as: 'stores' });
  User.hasMany(Order, { foreignKey: 'user_id', as: 'customerOrders' });
  User.hasMany(Order, { foreignKey: 'delivery_partner_id', as: 'deliveryOrders' });

  // Store associations
  Store.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
  Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
  Store.hasMany(Order, { foreignKey: 'store_id', as: 'orders' });

  // Category associations
  Category.hasMany(Category, { foreignKey: 'parent_category_id', as: 'children' });
  Category.belongsTo(Category, { foreignKey: 'parent_category_id', as: 'parent' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

  // Product associations
  Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  // Order associations
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });
  Order.belongsTo(User, { foreignKey: 'delivery_partner_id', as: 'deliveryPartner' });
  Order.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

  return {
    User,
    Store,
    Product,
    Order,
    Category
  };
};

module.exports = initializeModels;
