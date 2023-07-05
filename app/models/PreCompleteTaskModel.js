module.exports = (sequelize, Sequelize) => {
	const PreCompleteTaskModel = sequelize.define("pre_complete_tasks", {
	  id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
		  primaryKey: true,
		  autoIncrement: true
	  },
	  user_id: {
		  type: Sequelize.INTEGER(11),
		  allowNull: true
	  },
      initiate_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
	  payload: {
		  type: Sequelize.JSON(300),
		  allowNull: true
	  },
      process_priority: {
		type: Sequelize.INTEGER(11),
		allowNull: true
	  },
    complete_status: {
		type: Sequelize.TINYINT(2),
		allowNull: true,
		default:0
	  },
	  reprocess: {
		type: Sequelize.TINYINT(1),
		allowNull: true,
		default:0
	  },
	  process_date: {
		type: Sequelize.STRING(50),
		allowNull: true,
		default:0
	  },
	  complete_date: {
		type: Sequelize.STRING(50),
		allowNull: true,
		default:0
	  },
	  job_id: {
		type: Sequelize.STRING(100),
		allowNull: true,
	  }
	  

  },
	);
	return PreCompleteTaskModel;
};









