module.exports = (sequelize, Sequelize) => {
	const OtpVerificationModel = sequelize.define("otpverifications", {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		user_id: {
			type: Sequelize.INTEGER,
			allowNull: false,
		},
		email: {
			type: Sequelize.STRING(255),
			allowNull: true
		},
		mobile: {
			type: Sequelize.BIGINT(15),
			allowNull: true
		},
		otp: {
			type: Sequelize.TINYINT(6),
			allowNull: true
		},
		mobile_verified: {
			type: Sequelize.TINYINT(4),
			defaultValue: "0",
			Comment: '0:"Not Verified", 1:"Verified'
		},
		
		email_verified: {
			type: Sequelize.TINYINT(4),
			defaultValue: "0",
			Comment: '0:"Not Verified", 1:"Verified'
		},
		status: {
			type: Sequelize.STRING(10),
			allowNull: true
		},
	});
	return OtpVerificationModel;

};