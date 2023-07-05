module.exports = (sequelize, Sequelize) => {
    const NotificationDetailModel = sequelize.define("notification_details", {
        id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        notification: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        title: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        log:{
            type: Sequelize.TEXT,
            allowNull: true
        }
    });
    return NotificationDetailModel;
}