module.exports = (sequelize, Sequelize) => {
	const EmailTamplateModel = sequelize.define("email_tamplates", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        content:{
            type: Sequelize.TEXT(),
		    allowNull: true
        },
        status:{
            type: Sequelize.TINYINT(1),
		    allowNull: true
        },
        
    });
    return EmailTamplateModel;
}