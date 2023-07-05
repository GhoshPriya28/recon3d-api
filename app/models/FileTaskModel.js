module.exports = (sequelize, Sequelize) => {
	const FileTaskModel = sequelize.define("file_task", {
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
	  collect_name: {
		type: Sequelize.STRING(50),
		allowNull: true,
	  },
	  collect_notes: {
		type: Sequelize.STRING(50),
		allowNull: true,
	  },
	  src_type: {
		type: Sequelize.STRING(50),
		allowNull: true,
	  },
	  ep_collect_id: {
	  	type: Sequelize.STRING(50),
		allowNull: true,
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
	  /*s3_file_url: {
		type: Sequelize.STRING, 
        get: function() {
            return JSON.parse(this.getDataValue('s3_file_url'));
        }, 
        set: function(val) {
            return this.setDataValue('s3_file_url', JSON.stringify(val));
        },
		allowNull: true
	  },*/
	  s3_file_url: {
		type: Sequelize.STRING, 
		allowNull: true
	  },
	  s3_3d_url: {
		type: Sequelize.STRING,
		allowNull: true
	  },
	  internal_status: {
		type: Sequelize.TINYINT(2),
		allowNull: true,
		default:0
	  },
	  task_request: {
		type: Sequelize.STRING, 
		allowNull: true
	  },
	  reupload: {
		type: Sequelize.TINYINT(1),
		allowNull: true,
		default:1
	  },
	  priority: {
		type: Sequelize.INTEGER(11),
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

	return FileTaskModel;
};
