module.exports = (sequelize, Sequelize) => {
	const EmailsupportModel = sequelize.define("support_email", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
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
        }
    });
    return EmailsupportModel;
}