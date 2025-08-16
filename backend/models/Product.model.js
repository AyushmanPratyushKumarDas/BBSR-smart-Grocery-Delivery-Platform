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
    allowNull: true,
    defaultValue: []
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
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
  isImported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  manufacturingDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  countryOfOrigin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  certifications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  allergens: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  nutritionalInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  storageInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preparationInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
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
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  soldCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
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
    },
    {
      fields: ['price']
    },
    {
      fields: ['rating']
    },
    {
      fields: ['stockQuantity']
    }
  ]
});

// Instance method to check if product is in stock
Product.prototype.isInStock = function() {
  return this.stockQuantity > 0;
};

// Instance method to check if product is low on stock
Product.prototype.isLowStock = function() {
  return this.stockQuantity <= this.minStockLevel;
};

// Instance method to get discounted price
Product.prototype.getDiscountedPrice = function() {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
};

// Instance method to get public product info
Product.prototype.getPublicInfo = function() {
  const product = this.toJSON();
  delete product.isDeleted;
  return product;
};

module.exports = Product;
