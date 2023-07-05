module.exports = (sequelize, Sequelize) => {
	const FaqsModel = sequelize.define("faqs", {
        id : {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        question: {
			type: Sequelize.TEXT(),
		    allowNull: true
		},
		answer: {
			type: Sequelize.TEXT(),
		    allowNull: true
		}
        
        
    });
    return FaqsModel;
}