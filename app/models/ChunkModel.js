module.exports = (sequelize, Sequelize) => {
	const ChunkModel = sequelize.define("uploaded_part", {
        id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
        initiate_id:{
            type: Sequelize.STRING(20),
		    allowNull: true
        },
        chunk_file:{
            type: Sequelize.TEXT,
		    allowNull: true
        },
        chunk_index:{
            type: Sequelize.INTEGER,
		    allowNull: true
        },
        status:{
            type: Sequelize.INTEGER,
		    allowNull: true
        },
        

    });
    return ChunkModel;
}