module.exports = function(sequelize, DataTypes) {
    const order_products = sequelize.define('order_products', {
       id: {
            type: DataTypes.INTEGER(15),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
      },
      order_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {        
          model: 'orders',
          key: 'id'
        }
      },
      shopify_order_id: {
          type: DataTypes.STRING(30),
          allowNull: false
      },      
      shopify_product_id: {
        type :  DataTypes.STRING(40),
        allowNull: false
      },
      variant_id: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      quantity: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue : 0
      },
      product_name:{
        type :  DataTypes.STRING(255),
        allowNull: false
      },
      createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
        allowNull: true
      },
      updatedAt: {
         field: 'updated_at',
         type: DataTypes.DATE,
         allowNull: true
      }
    }, {
      tableName: 'order_products'
    });
    order_products.associate = function(models) {
      order_products.belongsTo(models.orders, {foreignKey: 'order_id', as: 'order'})
    };
    return order_products;
  };