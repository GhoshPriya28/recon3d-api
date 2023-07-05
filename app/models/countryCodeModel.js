module.exports = (sequelize, Sequelize) => {
	const CountryModel = sequelize.define("countries_isd_flags", {
        countries_id : {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        countries_name: {
			type: Sequelize.STRING(60),
			allowNull: false,
		},
		countries_iso_code: {
			type: Sequelize.STRING(50),
			allowNull: false,
		},
        countries_isd_code: {
			type: Sequelize.STRING(50),
			allowNull: false,
		},
        
        
    });
    return CountryModel;
}