const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
 const RoleModel = sequelize.define('i3_role_master', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('1','0'),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'i3_role_master',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  return RoleModel;
};
