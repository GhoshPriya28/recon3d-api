const db = require("../models");
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,DeviceDetailModel:DeviceDetailModel} = db;
const Op = db.Sequelize.Op;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('AuthKey');
const path = require('url');
const userResponseUtility = require("../helpers/userResponseUtility");

/* Check Value Exist*/

exports.login = [	
    body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if(!errors.isEmpty())
			{
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				UserModel.findOne({where: {email: req.body.email}}).then(user => {
					if(user)
					{                        
						bcrypt.compare(req.body.password,user.password,function (err,same) {
							if(same)
							{
								let updateData={
									user_firebase_id:req.body.user_firebase_id?req.body.user_firebase_id:'',
							        //user_device_id:req.body.user_device_id?req.body.user_device_id:'',
								}
								let updateDataDevice={
									user_firebase_id:req.body.user_firebase_id?req.body.user_firebase_id:'',
							        user_device_id:req.body.user_device_id?req.body.user_device_id:'',
							        user_id:user.id?user.id:'',
							        //user_device_id:req.body.user_device_id?req.body.user_device_id:'',
								}
								UserModel.update(updateData, {where:{email : req.body.email}}).then(data => {
                                   console.log('updateDataDevice',updateDataDevice);
									DeviceDetailModel.findOrCreate({where:{user_device_id:req.body.user_device_id},defaults: updateDataDevice}).then(async initiateDetails => {
								  });
								  var result = userResponseUtility.getUserResponse(user);
								  return apiResponse.successResponseWithData(res,"Login Success.", result);	
								})

								
							}
							else
							{
								return apiResponse.notFoundResponse(res, "Invalid Email or Password.");
							}
						});
					}
					else
					{
						return apiResponse.notFoundResponse(res, "Invalid Email or Password.");
					}
				});
			}
		}
		catch (err)
		{
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

exports.socialLogin = [
	body("socialId").isLength({ min: 1 }).trim().withMessage("Social id must be specified."),
	body("social_token").isLength({ min: 1 }).trim().withMessage("Social token must be specified."),
	body("provider").isLength({ min: 1 }).trim().withMessage("Provider must be specified."),
	body("login_type").isLength({ min: 1 }).trim().withMessage("Login Type must be specified."),
	body("userName").isLength({ min: 1 }).trim().withMessage("Name must be specified."),
	body("userEmail").isLength({ min: 1 }).trim().withMessage("Email must be specified."),
	sanitizeBody("userEmail").escape(),
    async (req, res) => {
        try
        {        	
	        let socialId = req.body.socialId;
	        let social_token = req.body.social_token;
	        let provider = req.body.provider;
	        let login_type = req.body.login_type;
	        let deviceToken = req.body.deviceToken;
	        let userName = req.body.userName;
	        let userEmail = req.body.userEmail;
        	
        	const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
	            if(provider.toLowerCase() === 'google')
	            {	            	
					let userData = {
						google_social_id : socialId,
				        google : social_token,
				        user_device_id : deviceToken,
				        first_name : userName,
				        email : userEmail,
				        is_social: 1,
					}
					let query = {google_social_id : socialId};
					let checkQuery = {email:userEmail,google_social_id:null,google:null};
	            	let userDetails = await checkSocial(userData,query,checkQuery,userEmail);
	            	return apiResponse.successResponseWithData(res,"Login Successfully.", userDetails);
	            }

	            if(provider.toLowerCase() === 'facebook')
	            {
	            	let userData = {
						facebook_social_id : socialId,
				        facebook : social_token,
				        user_device_id : deviceToken,
				        first_name : userName,
				        email : userEmail,
				        is_social: 1,
					}
					let query = {facebook_social_id : socialId};
					let checkQuery = {email:userEmail,facebook_social_id:null,facebook:null};
	            	let userDetails = await checkSocial(userData,query,checkQuery,userEmail);
	            	return apiResponse.successResponseWithData(res,"Login Successfully.", userDetails);
	            }

	            if(provider.toLowerCase() === 'apple')
	            {
	            	let userData = {
						apple_social_id : socialId,
				        apple : social_token,
				        user_device_id : deviceToken,
				        first_name : userName,
				        email : userEmail,
				        is_social: 1,
					}
					let query = {apple_social_id : socialId};
					let checkQuery = {email:userEmail,apple_social_id:null,apple:null};
	            	let userDetails = await checkSocial(userData,query,checkQuery,userEmail);
	            	return apiResponse.successResponseWithData(res,"Login Successfully.", userDetails);
	            }
	        }
        }
        catch(err)
        {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

exports.updateSocial = [
	// auth,
    body("userId").isLength({ min: 1 }).trim().withMessage("User Id must be specified."),
    body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified."),

    function (req, res)
    {
    	try 
    	{
            const errors = validationResult(req);
            if (!errors.isEmpty())
            {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());				
			}
			else
			{
				var userData = 
				{
					email: req.body.email,
				}
				var query = {id : req.body.userId};
				UserModel.findOne({ where:query}).then(async reg_user => {
					if(reg_user)
					{
						await UserModel.update(userData, {where:query}).then(userdata => {
							if(userdata)
							{
								UserModel.findOne({where: query}).then(userDetail => {
									if(userDetail)
									{
										var result = userResponseUtility.getUserResponse(userDetail);
										return apiResponse.successResponseWithData(res,"Updated successfully.", result);
									}
								});
							}
							else
							{
								return apiResponse.notFoundResponse(res, "Not Updated.");
							}
						});
					}
					else
					{
						return apiResponse.notFoundResponse(res, "Invalid user.");
					}
				});
			}
		}
		catch (err)
		{
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

async function checkSocial(userData,socialQuery,checkQuery,emailId)
{
	return new Promise(function(resolve, reject) {
		UserModel.findOne({where: socialQuery}).then(user => {
			if(user)
            {
            	let userData = userResponseUtility.getUserResponse(user);
                resolve(userData);
            }
            else
            {
            	UserModel.findOne({where: checkQuery}).then(userRecord => {
            		if(userRecord)
            		{
            			UserModel.update(userData, {where:{email:emailId},raw:true}).then(async data => {
                            UserModel.findOne({where:{email:emailId}}).then(updatedUserData => {
	                            resolve(userResponseUtility.getUserResponse(updatedUserData));            
	                        }).catch(err => {
								reject(err);
							});
                        }).catch(err => {
                            reject(err);
                        });
            		}
            		else
            		{
            			UserModel.create(userData).then(data => {
	                        let result=userResponseUtility.getUserResponse(data);
	                        resolve(result);
	                    }).catch(err => {
	                        reject(err);
	                    });
            		}
            	});
            }
		});
	});
}

