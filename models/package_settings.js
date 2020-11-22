module.exports = function(sequelize, DataTypes) {
    return sequelize.define('package_settings', {
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
      package: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        default: 1
      },
      value: {
        type: DataTypes.STRING(255),
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
      tableName: 'package_settings'
    });
  };