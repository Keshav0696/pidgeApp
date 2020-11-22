module.exports = function(sequelize, DataTypes) {
  const users =  sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    store_id:  {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    shop_name:  {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    shop_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    shop_domain: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // shop_currency: {
    //   type: DataTypes.STRING(10),
    //   allowNull: true
    // },
    private_api_key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    private_app_password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    generated_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    primary_location_id: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    orderSync : {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    productSync : {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status : {
      type :  DataTypes.BOOLEAN,
      defaultValue: 1
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
    tableName: 'users'
  });
  users.associate = function(models) {
    users.hasMany(models.orders, {as: 'orders', foreignKey: 'user_id'});
    users.hasMany(models.products, {as: 'products', foreignKey: 'user_id'});

  };
  return users;
};