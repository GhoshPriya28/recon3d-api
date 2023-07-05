module.exports = (sequelize, Sequelize) => {
	const PaymentModel = sequelize.define("payment_details", {
        payment_id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
		  primaryKey: true,
		  autoIncrement: true
	  },
	  user_id: {
		  type: Sequelize.INTEGER,
		  allowNull: false,
	  },
      product_id: {
        type: Sequelize.STRING(150),
        allowNull: true,
    },
	  transaction_id: {
	  	type: Sequelize.STRING(150),
		allowNull: true,
	  },
	  source: {
        type: Sequelize.STRING(15),
		  allowNull: true
	  },
	  total_amount: {
		  type: Sequelize.INTEGER,
		  allowNull: true
	  },
      payment_status: {
        type: Sequelize.STRING(100),
		allowNull: true
      },
	  from_date: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
	  to_date: {
		type: Sequelize.STRING(100),
		allowNull: true
	  },
      subscription: {
		type: Sequelize.ENUM('0', '1'),
		allowNull: true
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
	return PaymentModel
    ;
};
