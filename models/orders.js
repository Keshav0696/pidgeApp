module.exports = function(sequelize, DataTypes) {
    const orders =  sequelize.define('orders', {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      user_id : {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {        
          model: 'users',
          key: 'id'
        }
      },
      shopify_order_id:{
        type: DataTypes.STRING(30),
        allowNull: false
      },
      name :{
        type :  DataTypes.STRING(255),
        allowNull: false
      },  
      order_no:{
        type: DataTypes.STRING(20),
        allowNull: false
      },
      customer_name : {
          type :  DataTypes.STRING(255),
          allowNull: false
      },
      customer_phone : {
        type :  DataTypes.STRING(255),
        allowNull: true
      },
      customer_address : {
        type :  DataTypes.STRING(255),
        allowNull: true
      },
      fulfillment_status: { // fulfilled, null, partial, restocked
        type :  DataTypes.STRING(255),
        allowNull: true
      },
      total_volume: {
        type: DataTypes.INTEGER(11),
        default : 0
      },
      packages: {
        type: DataTypes.STRING, 
        get: function() {
            return JSON.parse(this.getDataValue('packages'));
        }, 
        set: function(val) {
            return this.setDataValue('packages', JSON.stringify(val));
        }
      },
      customer_coordinates: {
        type: DataTypes.STRING, 
        get: function() {
            return JSON.parse(this.getDataValue('customer_coordinates'));
        }, 
        set: function(val) {
            return this.setDataValue('customer_coordinates', JSON.stringify(val));
        }
      },
      price: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },      
      financial_status :{
        type :  DataTypes.STRING(255),
        allowNull: true
      },
      delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        default: null
      },
      delivery_time: {
        type: DataTypes.TIME,
        allowNull: true,
        default: null
      },
      shipping_address: {
        type: DataTypes.JSON,
        allowNull: true,
        default: null
      },
      order_status: { // open, closed, cancelled, any
        type: DataTypes.STRING(20),
        allowNull: false,
        default: 'open'
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
      tableName: 'orders'
    });
    orders.associate = function(models) {
      orders.hasMany(models.order_products, {as: 'products', foreignKey: 'order_id'});
      orders.belongsTo(models.users, {foreignKey: 'user_id', as: 'user'})
    };
    return orders;
  };