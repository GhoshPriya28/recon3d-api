module.exports = (sequelize, Sequelize) => {
	const ContactModel = sequelize.define("i3_contact_us", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        name:{
            type: Sequelize.STRING(100),
            allowNull: true
        },
        email:{
            type: Sequelize.STRING(50),
            allowNull: true
        },
        contact:{
            type: Sequelize.BIGINT(20),
            allowNull: true
        },
        message:{
            type: Sequelize.TEXT(),
            allowNull: true
        }
    });
    return ContactModel;
}