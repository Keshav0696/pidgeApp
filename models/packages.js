module.exports = function(sequelize, DataTypes) {
    return sequelize.define('packages', {
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
      height: {
        type: DataTypes.FLOAT(5,2),
        allowNull: false
      },
      width: {
        type: DataTypes.FLOAT(5,2),
        allowNull: false
      },
      breadth: {
        type: DataTypes.FLOAT(5,2),
        allowNull: false
      },
      volume: {
        type: DataTypes.FLOAT(10,2),
        allowNull: false
      },
      package_range: {
        type: DataTypes.FLOAT(10,2),
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
      tableName: 'packages'
    });
  };