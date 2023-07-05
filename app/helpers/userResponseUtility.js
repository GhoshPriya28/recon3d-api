const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const jwt = require("jsonwebtoken");

exports.getUserResponse = function(userResponseData,type = '',version='')
{	

	var profileImg = configFile.getBaseUrl()+constants.path.profileViewPath+'default.png';
	if(userResponseData.user_profile_pic)
	{
		var profileImg=configFile.getBaseUrl()+constants.path.profileViewPath+userResponseData.user_profile_pic;
	}

	let userData = {
		userId: userResponseData.id,
		first_name: userResponseData.first_name,
		last_name: userResponseData.last_name,
		email: userResponseData.email,
		is_subscribe: parseInt(userResponseData.is_subscribe),
		orgnization_name:userResponseData.orgnization_name?userResponseData.orgnization_name:'', 
		
		is_password_change:(userResponseData.is_password_change == 1)?true:false,
		
		tnc: (userResponseData.tnc == 1)?true:false,
		profileImg:profileImg,
		is_social:(userResponseData.is_social == 1)?true:false,
		first_time_social:(userResponseData.is_social === 1 && !userResponseData.email)?true:false,
	};

	if(type == '')
	{
		let payloadData = {
			userId: userResponseData.id,
			email: userResponseData.email,
		};
		//Prepare JWT token for authentication
		const jwtPayload = payloadData;
		const jwtData = {
			expiresIn: process.env.JWT_TIMEOUT_DURATION,
		};
		const secret = process.env.JWT_SECRET;
		//Generated JWT token with Payload and secret.	
		userData.token = jwt.sign(jwtPayload, secret, jwtData);
	}
	return userData;
}

