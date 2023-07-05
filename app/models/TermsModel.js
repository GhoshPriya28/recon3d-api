module.exports = (sequelize, Sequelize) => {
	const TermsModel = sequelize.define("terms", {
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
    return TermsModel;
}