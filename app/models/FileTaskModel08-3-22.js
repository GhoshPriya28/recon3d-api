module.exports = (sequelize, Sequelize) => {
	const UserModel = sequelize.define("file_task", {
	  id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
		  primaryKey: true,
		  autoIncrement: true
	  },
	  initiate_id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
	  },
	  user_id: {
		  type: Sequelize.INTEGER(11),
		  allowNull: false
	  },
	  file_size: {
		  type: Sequelize.STRING(255),
		  allowNull: true
	  },
	  file_type: {
		type: Sequelize.STRING(30),
		allowNull: true
	  },
	  file_ext: {
		type: Sequelize.STRING(10),
		allowNull: true
	  },
	  total_files: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		default:0
	  },
	  chunks: {
		type: Sequelize.STRING(50),
		allowNull: true
	  },
	  left_chunk: {
		type: Sequelize.INTEGER(11),
		allowNull: true
	  },
	  s3_file_url: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
	  s3_3d_url: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
	  internal_status: {
		type: Sequelize.TINYINT(2),
		allowNull: true,
		default:0
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
