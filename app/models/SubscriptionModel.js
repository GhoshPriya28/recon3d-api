module.exports = (sequelize, Sequelize) => {
	const SubscriptionModel = sequelize.define("plan_masters", {
      plan_id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
		  primaryKey: true,
		  autoIncrement: true
	  },
	  product_id: {
		  type: Sequelize.STRING(150),
		  allowNull: false,
	  },
      product_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
	  product_description: {
	  	type: Sequelize.TEXT(),
		allowNull: true,
	  },
	  plan_source: {
          type: Sequelize.ENUM('Android', 'IOS'),
		  allowNull: false
	  },
	  plan_type: {
		  type: Sequelize.STRING(100),
		  allowNull: true
	  },
      plan_duration: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
	  plan_amount: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
	  discount_amount: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
      payable_amount: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
      plan_status: {
		type: Sequelize.INTEGER,
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
	return SubscriptionModel;
};
