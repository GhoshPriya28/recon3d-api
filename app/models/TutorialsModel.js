module.exports = (sequelize, Sequelize) => {
	const TutorialsModel = sequelize.define("tutorials", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		video_url: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		title: {
			type: Sequelize.STRING(255),
			allowNull: false,
		}, 
		description: {
			type: Sequelize.STRING(255),
			allowNull: false,
		}
    });
    return TutorialsModel;
}