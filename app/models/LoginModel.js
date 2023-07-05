module.exports = (sequelize, Sequelize) => {
	const LoginModel = sequelize.define("admin_login", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: Sequelize.STRING(20),
			allowNull: false,
		},
		email: {
			type: Sequelize.STRING(20),
			allowNull: false,
		},
		password: {
			type: Sequelize.STRING(50),
			allowNull: false,
		},
        contact: {
			type: Sequelize.INTEGER(10),
			allowNull: false,
		},
        type: {
			type:Sequelize.TINYINT(2),
			allowNull: false,
		},
		status: {
			type:Sequelize.TINYINT(2),
			allowNull: false,
		},
        
		
    });
    return LoginModel;
}