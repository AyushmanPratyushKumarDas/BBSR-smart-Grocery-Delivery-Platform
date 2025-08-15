const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
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
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 15]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('grocery', 'supermarket', 'convenience', 'specialty'),
    defaultValue: 'grocery'
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  operatingHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '08:00', close: '22:00', isOpen: true }
    }
  },
  deliveryRadius: {
    type: DataTypes.INTEGER, // in kilometers
    defaultValue: 10
  },
  minimumOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  averagePreparationTime: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 30
  },
  paymentMethods: {
    type: DataTypes.JSONB,
    defaultValue: ['cash', 'card', 'upi', 'wallet']
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true
});

// Instance method to calculate average rating
Store.prototype.updateRating = function(newRating) {
  const totalRating = (this.rating * this.totalRatings) + newRating;
  this.totalRatings += 1;
  this.rating = totalRating / this.totalRatings;
  return this.save();
};

// Instance method to check if store is open
Store.prototype.isOpenNow = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3);
  const time = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours[day];
  if (!todayHours || !todayHours.isOpen) return false;
  
  return time >= todayHours.open && time <= todayHours.close;
};

module.exports = Store;

