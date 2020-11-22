module.exports = function(sequelize, DataTypes) {
  return sequelize.define('zones', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT(5,2),
      allowNull: false
    },
    zipcode: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      default: 1
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
    tableName: 'zones'
  });
};