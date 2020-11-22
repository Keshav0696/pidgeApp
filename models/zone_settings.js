module.exports = function(sequelize, DataTypes) {
    return sequelize.define('zone_settings', {
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
      max_order_value: {
        type: DataTypes.FLOAT(10,2),
        allowNull: false
      },
      fixed_rate: {
        type: DataTypes.FLOAT(5,2),
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
      tableName: 'zone_settings'
    });
  };