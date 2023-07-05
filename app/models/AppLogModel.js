module.exports = (sequelize, Sequelize) => {
	const AppLogModel = sequelize.define("app_logs", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
           
        },
        full_name:{
            type: Sequelize.STRING(100),
            allowNull: true
        },
        email:{
            type: Sequelize.STRING(50),
            allowNull: true
        },
        description:{
            type: Sequelize.TEXT(),
            allowNull: true
        },
        logFile:{
            type: Sequelize.STRING(50),
            allowNull: true
        }
    });
    return AppLogModel;
}