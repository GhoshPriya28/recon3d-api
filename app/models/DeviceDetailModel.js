module.exports = (sequelize, Sequelize) => {
    const DeviceDetailModel = sequelize.define("device_details", {
        id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true
        },
        user_device_id: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        device_type: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        device_version: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        user_firebase_id: {
            type: Sequelize.STRING(100),
            allowNull: true
        }
    });
    return DeviceDetailModel;
};