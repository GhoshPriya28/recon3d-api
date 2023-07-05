module.exports = (sequelize, Sequelize) => {
	const TaskListModel = sequelize.define("sub_tasks", {
	  id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
		  primaryKey: true,
		  autoIncrement: true
	  },
	 initiate_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    merge_file:{
      type: Sequelize.TEXT(),
      allowNull: false
    },
    merge_file_path:{
      type: Sequelize.TEXT(),
      allowNull: false
    },
    size:{
      type: Sequelize.STRING(30),
      allowNull: false
    },
    file_index:{
      type: Sequelize.INTEGER(11),
      allowNull: false
    },
     

	 
	  
	  
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

	return TaskListModel;
};
