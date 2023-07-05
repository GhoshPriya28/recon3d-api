module.exports = (sequelize, Sequelize) => {
	const NotificationModel = sequelize.define("i3_notifications", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        to_user:{
            type: Sequelize.INTEGER,
			allowNull: false,
        },
        from_user:{
            type: Sequelize.INTEGER,
			allowNull: false,
        },
        notification:{
            type: Sequelize.TEXT,
			allowNull: false,
        }

    });
    return NotificationModel;
}