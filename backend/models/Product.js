const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Stores',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.ENUM(
      'fruits-vegetables',
      'dairy-bakery',
      'meat-fish',
      'pantry-staples',
      'beverages',
      'snacks',
      'household',
      'personal-care',
      'baby-care',
      'pet-supplies',
      'frozen-foods',
      'organic',
      'imported'
    ),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'piece'
  },
  weight: {
    type: DataTypes.DECIMAL(8, 3), // in kg
    allowNull: true
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: 0
    }
  },
  maxStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isOrganic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVegetarian: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isGlutenFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nutritionalInfo: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  allergens: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSold: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  preparationTime: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 0
  },
  returnPolicy: {
    type: DataTypes.ENUM('no-return', 'same-day', '24-hours', '7-days'),
    defaultValue: 'no-return'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['category']
    },
    {
      fields: ['storeId']
    },
    {
      fields: ['isAvailable']
    },
    {
      fields: ['isFeatured']
    }
  ]
});

// Instance method to update stock
Product.prototype.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.stockQuantity += quantity;
  } else if (operation === 'subtract') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  }
  
  // Update availability based on stock
  this.isAvailable = this.stockQuantity > 0;
  
  return this.save();
};

// Instance method to check if product is in stock
Product.prototype.isInStock = function(requiredQuantity = 1) {
  return this.isAvailable && this.stockQuantity >= requiredQuantity;
};

// Instance method to calculate discounted price
Product.prototype.getDiscountedPrice = function() {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
};

// Instance method to update rating
Product.prototype.updateRating = function(newRating) {
  const totalRating = (this.rating * this.totalRatings) + newRating;
  this.totalRatings += 1;
  this.rating = totalRating / this.totalRatings;
  return this.save();
};

module.exports = Product;

