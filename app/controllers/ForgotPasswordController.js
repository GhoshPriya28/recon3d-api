require('dotenv').config();
const { BASE_URL,PORTAL_BASE_URL,ADMIN_BASE_URL} = process.env;
const db = require("../models");
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,EmailTamplateModel:EmailTamplateModel} = db;
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

/* Forgot Password*/
exports.forgatePassword = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.").isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try
		{
			var linkUrl = req.body.linkUrl;

			const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				UserModel.findOne({where : {email : req.body.email}}).then(user => {
					EmailTamplateModel.findOne({where: { id: '1'} }).then((tamplate) => {
					if(user)
					{
                        
						var tamplate=tamplate.content; 
					   var generatedPassword = utility.generatePassword();
						 
				        bcrypt.hash(generatedPassword,10,function(err, hash) 
				        {

				        
						let updateData={ref_password:generatedPassword,password:hash}
						UserModel.update(updateData, {where:{email : req.body.email}}).then(data => {
							tamplate = tamplate.replace('Username',user.first_name+' '+user.last_name); 
                           if(!req.body.linkUrl)
							 {
								var link = `http://54.236.108.107:8080/web/admin/reset-password?username=${user.email}&password=${generatedPassword}`;
							 }
							 else
							 {
								var link = `http://54.236.108.107:8080/web/admin/reset-password?username=${user.email}&password=${generatedPassword}`;
							 }
							 tamplate = tamplate.replace('forgate_link',link);

							mailer.send(
							constants.confirmEmails.from, 
							req.body.email,
							"Link for Reset Password",
							tamplate
							).then(function() {

								let updateData={is_password_change:0}
									UserModel.update(updateData, {where:{email : req.body.email}}).then(data => {
										return apiResponse.successResponse(res,"Please check your email for the new password.");
									}).catch(err => {
										console.log(err);
										//return apiResponse.ErrorResponse(res, err);
									});
								
							}).catch(err => {
							//return apiResponse.ErrorResponse(res, err);
						    });
						    let updateData={is_password_change:0}
							UserModel.update(updateData, {where:{email : req.body.email}}).then(data => {
								return apiResponse.successResponse(res,"Please check your email for the new password.");
							}).catch(err => {
								console.log(err);
								//return apiResponse.ErrorResponse(res, err);
							});
						}).catch(err => {
							//return apiResponse.ErrorResponse(res, err);
						});
						});	



						
					}
					else
					{
						return apiResponse.notFoundResponse(res, "Invalid Email.");
					}
				    }).catch(err => {
					return apiResponse.ErrorResponse(res, err);
				    });
				});
			}
		}	
		catch (err)
		{
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/*Reset Password */
exports.resetPassword = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.").isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	body("confirmPassword").isLength({ min: 6 }).trim().withMessage("Confirm Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),

	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				if(req.body.password == req.body.confirmPassword)
				{
					bcrypt.hash(req.body.password,10,function(err, hash) {
						UserModel.findOne({where:{email : req.body.email}}).then(reg_user => {
							if(reg_user)
							{
								let updateData={password: hash,	is_password_change:1,ref_password:req.body.password}
								UserModel.update(updateData, {where:{email : req.body.email}}).then(data => {
									var result = userResponseUtility.getUserResponse(reg_user);
									return apiResponse.successResponseWithData(res,"Password has been changed.",result);
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});								
							}
							else
							{
								return apiResponse.notFoundResponse(res, "Invalid Email.");
							}
						});						
					})
				}
				else
				{
					return apiResponse.successResponse(res,"Password and Confirm Password are not match.");
				}
			}
		}
		catch (err)
		{
			return apiResponse.ErrorResponse(res, err);
		}
	}
];