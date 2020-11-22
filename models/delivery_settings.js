module.exports = function(sequelize, DataTypes) {
  return sequelize.define('delivery_settings', {
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
    shopify_carrier_service_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    monday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    tuesday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    wednesday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    thursday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    friday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    saturday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    sunday: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    slot_first_start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    slot_first_end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    slot_first_buffer_time: {
      type: DataTypes.INTEGER(2),
      default: 0
    },
    slot_first_status: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    slot_second_start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    slot_second_end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    slot_second_buffer_time: {
      type: DataTypes.INTEGER(2),
      default: 0
    },
    slot_second_status: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    slot_third_start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    slot_third_end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    slot_third_buffer_time: {
      type: DataTypes.INTEGER(2),
      default: 0
    },
    slot_third_status: {
      type: DataTypes.BOOLEAN,
      default: 0
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
    tableName: 'delivery_settings'
  });
};