module.exports = (sequelize, Sequelize) => {
	const ContactDetail = sequelize.define("i3_contact", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        phone:{
            type: Sequelize.STRING(100),
            allowNull: true
        },
        email:{
            type: Sequelize.STRING(100),
            allowNull: true
        },
        fax:{
            type: Sequelize.STRING(100),
            allowNull: true
        }

    });
    return ContactDetail;
}