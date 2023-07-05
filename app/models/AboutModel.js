module.exports = (sequelize, Sequelize) => {
	const AboutModel = sequelize.define("about_us", {
        id : {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        content: {
			type: Sequelize.TEXT(),
		    allowNull: true
		}
        
        
    });
    return AboutModel;
}