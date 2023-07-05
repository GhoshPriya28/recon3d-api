module.exports = (sequelize, Sequelize) => {
	const UserModel = sequelize.define("task_lists", {
	  id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
		  primaryKey: true,
		  autoIncrement: true
	  },
	  task_id: {
		  type: Sequelize.INTEGER(11),
		  allowNull: false
	  },
      list_id:{
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      file:{
        type: Sequelize.STRING(200),
        allowNull: true
      },
      upload_id:{
        type: Sequelize.STRING(20),
        allowNull: true
      },
      chunk_index:{
        type: Sequelize.INTEGER(11),
        allowNull: true
      },
      status:{
        type: Sequelize.TINYINT(1),
        allowNull: true
      }

	 
	  
	  
  },
  
  
  // {
  
  //     // don't add the timestamp attributes (updatedAt, createdAt)
  //     timestamps: false,  
  //     // If don't want createdAt
  //     createdAt: false,  
  //     // If don't want updatedAt
  //     updatedAt: false,  
  //     // your other configuration here  
  //   }
	);

	return UserModel;
};
