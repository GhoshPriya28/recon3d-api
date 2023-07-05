module.exports = (sequelize, Sequelize) => {
	const CityModel = sequelize.define("i3_cities", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        city:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        lat:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        lng:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        country:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        iso_code:{
            type: Sequelize.STRING(20),
			allowNull: false,
        },
        isd_code:{
            type: Sequelize.STRING(20),
            allowNull: true
        },
        status:{
            type: Sequelize.ENUM,
            values: ['1','2','3']
        }

    });
    return CityModel;
}