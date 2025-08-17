const { DataTypes } = require('sequelize');

const defineCategory = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    parent_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['parent_category_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance method to check if category is root
  Category.prototype.isRoot = function() {
    return !this.parent_category_id;
  };

  // Instance method to check if category has children
  Category.prototype.hasChildren = function() {
    // This would need to be implemented with a query
    return false;
  };

  // Instance method to get public category info
  Category.prototype.getPublicInfo = function() {
    const category = this.toJSON();
    return category;
  };

  return Category;
};

module.exports = defineCategory;
