module.exports = (sequelize, Sequelize) => {
	const EmailModel = sequelize.define("emails", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
    email: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		email_smtp_host: {
			type: Sequelize.STRING(255),
			allowNull: false,
		}, email_smtp_port: {
			type: Sequelize.STRING(255),
			allowNull: false,
		}, email_smtp_password: {
			type: Sequelize.STRING(255),
			allowNull: false,
		}
    });
    return EmailModel;
}