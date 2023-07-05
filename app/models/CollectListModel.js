module.exports = (sequelize, Sequelize) => {
	const CollectListModel = sequelize.define("collect_lists", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        collect_id:{
            type: Sequelize.STRING(200),
		    allowNull: true
        },
        status:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        callback_data:{
            type: Sequelize.TEXT,
		    allowNull: true
        }
    });
    return CollectListModel;
}