module.exports = (sequelize, Sequelize) => {
	const PrivacyPolicyModel = sequelize.define("privacy_policys", {
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
    return PrivacyPolicyModel;
}