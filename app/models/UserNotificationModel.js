module.exports = (sequelize, Sequelize) => {
    const UserNotificationModel = sequelize.define("users_notifications", {
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
            type: Sequelize.STRING(200),
            allowNull: true
        },
        notification_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true
        },
        status: {
			type:Sequelize.TINYINT(1),
			allowNull: true,
		},
    });
    return UserNotificationModel;
}