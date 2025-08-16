const { DataTypes } = require('sequelize');

const defineOrder = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Stores',
        key: 'id'
      }
    },
    deliveryPartnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidItems(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Order must have at least one item');
          }
        }
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'wallet'),
      allowNull: true
    },
    deliveryAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    deliveryCoordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidCoordinates(value) {
          if (!value.lat || !value.lng) {
            throw new Error('Delivery coordinates must have lat and lng');
          }
        }
      }
    },
    deliveryInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Preparation time in minutes'
    },
    deliveryTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Delivery time in minutes'
    },
    isPreOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preOrderDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isScheduled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customerRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    customerReview: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundReason: {
      type: DataTypes.TEXT,
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
        fields: ['customerId']
      },
      {
        fields: ['storeId']
      },
      {
        fields: ['deliveryPartnerId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentStatus']
      },
      {
        fields: ['orderNumber']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance method to calculate total
  Order.prototype.calculateTotal = function() {
    this.total = this.subtotal + this.tax + this.deliveryFee - this.discount;
    return this.total;
  };

  // Instance method to check if order can be cancelled
  Order.prototype.canBeCancelled = function() {
    const nonCancellableStatuses = ['delivered', 'cancelled', 'refunded'];
    return !nonCancellableStatuses.includes(this.status);
  };

  // Instance method to check if order can be modified
  Order.prototype.canBeModified = function() {
    const nonModifiableStatuses = ['preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
    return !nonModifiableStatuses.includes(this.status);
  };

  // Instance method to get order status timeline
  Order.prototype.getStatusTimeline = function() {
    const timeline = [];
    
    if (this.createdAt) {
      timeline.push({
        status: 'Order Placed',
        timestamp: this.createdAt,
        description: 'Order has been placed successfully'
      });
    }
    
    if (this.status === 'confirmed' || this.status === 'preparing' || this.status === 'ready_for_pickup' || this.status === 'out_for_delivery' || this.status === 'delivered') {
      timeline.push({
        status: 'Order Confirmed',
        timestamp: this.updatedAt,
        description: 'Store has confirmed your order'
      });
    }
    
    if (this.status === 'preparing' || this.status === 'ready_for_pickup' || this.status === 'out_for_delivery' || this.status === 'delivered') {
      timeline.push({
        status: 'Preparing Order',
        timestamp: this.updatedAt,
        description: 'Store is preparing your order'
      });
    }
    
    if (this.status === 'ready_for_pickup' || this.status === 'out_for_delivery' || this.status === 'delivered') {
      timeline.push({
        status: 'Ready for Pickup',
        timestamp: this.updatedAt,
        description: 'Order is ready for pickup/delivery'
      });
    }
    
    if (this.status === 'out_for_delivery' || this.status === 'delivered') {
      timeline.push({
        status: 'Out for Delivery',
        timestamp: this.updatedAt,
        description: 'Order is out for delivery'
      });
    }
    
    if (this.status === 'delivered') {
      timeline.push({
        status: 'Delivered',
        timestamp: this.actualDeliveryTime || this.updatedAt,
        description: 'Order has been delivered successfully'
      });
    }
    
    if (this.status === 'cancelled') {
      timeline.push({
        status: 'Cancelled',
        timestamp: this.updatedAt,
        description: 'Order has been cancelled'
      });
    }
    
    return timeline;
  };

  // Instance method to get estimated delivery time
  Order.prototype.getEstimatedDeliveryTime = function() {
    if (this.estimatedDeliveryTime) {
      return this.estimatedDeliveryTime;
    }
    
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + (this.preparationTime + this.deliveryTime) * 60000);
    return estimatedTime;
  };

  // Instance method to get public order info
  Order.prototype.getPublicInfo = function() {
    const order = this.toJSON();
    delete order.isDeleted;
    return order;
  };

  return Order;
};

module.exports = defineOrder;
