module.exports = function(sequelize, DataTypes) {
    const products =  sequelize.define('products', {
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
      product_id:{
        type: DataTypes.STRING(30),
        allowNull: false  
      },
      variant_id:{
          type: DataTypes.STRING(30),
          allowNull: false  
      },
      product_title:{
          type: DataTypes.STRING(255),
          allowNull: false  
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      size_height: {
        type: DataTypes.INTEGER(11),
      },
      size_width: {
        type: DataTypes.INTEGER(11),
      },
      size_breadth: {
        type: DataTypes.INTEGER(11),
      },
      dimensions: {
        type: DataTypes.INTEGER(11)
          },
      status: {
        type: DataTypes.TINYINT(1),
        defaultValue: 0
      },
      product_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
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
      tableName: 'products'
    });
    products.associate = function(models) {
      products.belongsTo(models.users, {foreignKey: 'user_id', as: 'user'})
    };
    return products;
  };