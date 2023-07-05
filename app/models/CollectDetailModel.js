module.exports = (sequelize, Sequelize) => {
	const CollectDetailModel = sequelize.define("collect_details", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        collect_id:{
            type: Sequelize.INTEGER(11),
		    allowNull: true
        },
        asset_name:{
            type: Sequelize.STRING(50),
		    allowNull: true
        },
        asset_type:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        asset_extension:{
            type: Sequelize.STRING(50),
		    allowNull: true
        },
        asset_size:{
            type: Sequelize.STRING(50),
		    allowNull: true
        },
        asset_url:{
            type: Sequelize.TEXT(),
		    allowNull: true
        },
    });
    return CollectDetailModel;
}