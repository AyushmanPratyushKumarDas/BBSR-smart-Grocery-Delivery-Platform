const { DataTypes } = require('sequelize');

const defineProduct = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Stores',
        key: 'id'
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'piece'
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    nutritional_info: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    allergens: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    origin: {
      type: DataTypes.STRING(200),
      allowNull: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['store_id']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['price']
      },
      {
        fields: ['stock']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['sku']
      },
      {
        fields: ['images'],
        using: 'GIN'
      },
      {
        fields: ['allergens'],
        using: 'GIN'
      },
      {
        fields: ['nutritional_info'],
        using: 'GIN'
      }
    ]
  });

  // Instance method to get final price after discount
  Product.prototype.getFinalPrice = function() {
    if (this.original_price && this.original_price > this.price) {
      return this.price;
    }
    return this.price;
  };

  // Instance method to check if product is in stock
  Product.prototype.isInStock = function() {
    return this.is_active && this.stock > 0;
  };

  // Instance method to check if stock is low
  Product.prototype.isLowStock = function() {
    return this.stock <= 10; // Default low stock threshold
  };

  // Instance method to update stock
  Product.prototype.updateStock = function(quantity, operation = 'decrease') {
    if (operation === 'decrease') {
      this.stock = Math.max(0, this.stock - quantity);
    } else if (operation === 'increase') {
      this.stock += quantity;
    }
  };

  // Instance method to get product rating
  Product.prototype.getRating = function() {
    return this.review_count > 0 ? this.rating : 0;
  };

  // Instance method to update rating
  Product.prototype.updateRating = function(newRating) {
    const currentTotal = this.rating * this.review_count;
    this.review_count += 1;
    this.rating = (currentTotal + newRating) / this.review_count;
  };

  // Instance method to check if product is on sale
  Product.prototype.isOnSale = function() {
    return this.original_price && this.original_price > this.price;
  };

  // Instance method to get public product info
  Product.prototype.getPublicInfo = function() {
    const product = this.toJSON();
    return product;
  };

  return Product;
};

module.exports = defineProduct;
