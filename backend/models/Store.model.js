const { DataTypes } = require('sequelize');

const defineStore = (sequelize) => {
  const Store = sequelize.define('Store', {
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
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    coordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidCoordinates(value) {
          if (!value.lat || !value.lng) {
            throw new Error('Coordinates must have lat and lng');
          }
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    banner_url: {
      type: DataTypes.STRING(500),
      allowNull: true
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
    is_open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    operating_hours: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    delivery_time: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    minimum_order: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['owner_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['location']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['coordinates'],
        using: 'GIN'
      },
      {
        fields: ['operating_hours'],
        using: 'GIN'
      }
    ]
  });

  // Instance method to get store rating
  Store.prototype.getRating = function() {
    return this.review_count > 0 ? this.rating : 0;
  };

  // Instance method to update rating
  Store.prototype.updateRating = function(newRating) {
    const currentTotal = this.rating * this.review_count;
    this.review_count += 1;
    this.rating = (currentTotal + newRating) / this.review_count;
  };

  // Instance method to check if store is open
  Store.prototype.isOpen = function() {
    const now = new Date();
    const day = now.toLocaleLowerCase().slice(0, 3);
    const time = now.toTimeString().slice(0, 5);
    
    const todayHours = this.operating_hours[day];
    if (!todayHours || !todayHours.isOpen) return false;
    
    return time >= todayHours.open && time <= todayHours.close;
  };

  // Instance method to get delivery fee based on distance
  Store.prototype.getDeliveryFee = function(distance) {
    // This would need to be implemented based on your business logic
    return this.delivery_fee;
  };

  return Store;
};

module.exports = defineStore;
