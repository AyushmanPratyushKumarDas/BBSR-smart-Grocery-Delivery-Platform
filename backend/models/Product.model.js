const { DataTypes } = require('sequelize');

const defineProduct = (sequelize) => {
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
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 0
      }
    },
    maxOrderQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    minOrderQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
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
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    nutritionalInfo: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    allergens: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isOrganic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isGlutenFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVegan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isHalal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isKosher: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Preparation time in minutes'
    },
    isPreOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preOrderDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Days in advance for pre-order'
    },
    isSeasonal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    seasonalStart: {
      type: DataTypes.DATE,
      allowNull: true
    },
    seasonalEnd: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isNewArrival: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isOnSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    saleStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    saleEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['storeId']
      },
      {
        fields: ['category']
      },
      {
        fields: ['isAvailable']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['price']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['isFeatured']
      },
      {
        fields: ['isOnSale']
      },
      {
        fields: ['tags'],
        using: 'GIN'
      }
    ]
  });

  // Instance method to get final price after discount
  Product.prototype.getFinalPrice = function() {
    if (this.discountPercentage > 0) {
      return this.price * (1 - this.discountPercentage / 100);
    }
    return this.price;
  };

  // Instance method to check if product is in stock
  Product.prototype.isInStock = function() {
    return this.isAvailable && this.stockQuantity > 0;
  };

  // Instance method to check if stock is low
  Product.prototype.isLowStock = function() {
    return this.stockQuantity <= this.lowStockThreshold;
  };

  // Instance method to update stock
  Product.prototype.updateStock = function(quantity, operation = 'decrease') {
    if (operation === 'decrease') {
      this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
    } else if (operation === 'increase') {
      this.stockQuantity += quantity;
    }
  };

  // Instance method to get product rating
  Product.prototype.getRating = function() {
    return this.totalRatings > 0 ? this.rating : 0;
  };

  // Instance method to update rating
  Product.prototype.updateRating = function(newRating) {
    const currentTotal = this.rating * this.totalRatings;
    this.totalRatings += 1;
    this.rating = (currentTotal + newRating) / this.totalRatings;
  };

  // Instance method to check if product is on sale
  Product.prototype.isOnSale = function() {
    if (!this.isOnSale) return false;
    const now = new Date();
    return (!this.saleStartDate || now >= this.saleStartDate) && 
           (!this.saleEndDate || now <= this.saleEndDate);
  };

  // Instance method to check if product is seasonal
  Product.prototype.isSeasonalNow = function() {
    if (!this.isSeasonal) return false;
    const now = new Date();
    return (!this.seasonalStart || now >= this.seasonalStart) && 
           (!this.seasonalEnd || now <= this.seasonalEnd);
  };

  // Instance method to get public product info
  Product.prototype.getPublicInfo = function() {
    const product = this.toJSON();
    delete product.isDeleted;
    return product;
  };

  return Product;
};

module.exports = defineProduct;
