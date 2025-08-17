const { DataTypes } = require('sequelize');

const defineOrder = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
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
    delivery_partner_id: {
      type: DataTypes.INTEGER,
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
            throw new Error('Items must be a non-empty array');
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
    delivery_fee: {
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
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    delivery_address: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    delivery_coordinates: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    estimated_delivery_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actual_delivery_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    order_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['store_id']
      },
      {
        fields: ['delivery_partner_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_status']
      },
      {
        fields: ['order_number']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['items'],
        using: 'GIN'
      },
      {
        fields: ['delivery_address'],
        using: 'GIN'
      }
    ]
  });

  // Instance method to calculate total
  Order.prototype.calculateTotal = function() {
    return this.subtotal + this.delivery_fee;
  };

  // Instance method to check if order can be cancelled
  Order.prototype.canBeCancelled = function() {
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    return cancellableStatuses.includes(this.status);
  };

  // Instance method to check if order is delivered
  Order.prototype.isDelivered = function() {
    return this.status === 'delivered';
  };

  // Instance method to check if order is paid
  Order.prototype.isPaid = function() {
    return this.payment_status === 'paid';
  };

  // Instance method to get order status display name
  Order.prototype.getStatusDisplayName = function() {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready_for_pickup': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    };
    return statusMap[this.status] || this.status;
  };

  // Instance method to get payment status display name
  Order.prototype.getPaymentStatusDisplayName = function() {
    const statusMap = {
      'pending': 'Pending',
      'paid': 'Paid',
      'failed': 'Failed',
      'refunded': 'Refunded'
    };
    return statusMap[this.payment_status] || this.payment_status;
  };

  return Order;
};

module.exports = defineOrder;
