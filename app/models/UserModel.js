module.exports = (sequelize, Sequelize) => {
	const UserModel = sequelize.define("app_users", {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		app_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true
		},
		app_name: {
			type: Sequelize.STRING(30),
			allowNull: true
		},
		email: {
			type: Sequelize.STRING(50),
			allowNull: true
		},
		user_mobile: {
			type: Sequelize.STRING(20),
			allowNull: true
		},
			ref_password: {
			type: Sequelize.STRING(100),
			allowNull: true
	    },
		password: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		first_name:{
			type: Sequelize.STRING(100),
			allowNull: true
		},
		last_name:{
			type: Sequelize.STRING(100),
			allowNull: true
		},
		orgnization_name:{
			type: Sequelize.STRING(100),
			allowNull: true
		},
		tnc:{
			type: Sequelize.TINYINT(2),
			defaultValue: "0",
			Comment: '0:"N", 1:"Y'
		},
		is_social: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		google: {
			type: Sequelize.STRING(255),
			allowNull: true
		},
		google_social_id: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		facebook: {
			type: Sequelize.STRING(255),
			allowNull: true
		},
		facebook_social_id: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		apple: {
			type: Sequelize.TEXT,
			allowNull: true
		},
		apple_social_id: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		user_firebase_id: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		user_device_id: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
			is_subscribe: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
		},
		  is_password_change:{
	        type: Sequelize.TINYINT(1),
			allowNull: true,
		},
		user_profile_pic: {
			type: Sequelize.STRING(200),
			allowNull: true
		},
		is_email_sent: {
		type: Sequelize.TINYINT(1),
		allowNull: true,
		},
		user_status: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
		},
		user_deleted_email: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		// job_priority: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: true,
		// },
		subscribe_starts: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
		subscribe_ends: {
			type: Sequelize.STRING(100),
			allowNull: true
		},
	});
	return UserModel;
};