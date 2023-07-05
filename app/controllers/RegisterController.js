const db = require("../models");
const { BASE_URL,PORTAL_BASE_URL} = process.env;
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,EmailTamplateModel: EmailTamplateModel,DeviceDetailModel:DeviceDetailModel} = db;
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
exports.checkValueExist = [
	body("checkType").isLength({ min: 1 }).trim().withMessage("CheckType must be specified."),
	body('checkValue').isLength({ min: 1 }).trim().withMessage("User Value must be specified.").custom((value, {req}) => {
		if(req.body.checkType == 'email')
		{
			return UserModel.findOne({where: {email: value}}).then((user) => {
				if(user)
				{
					return Promise.reject("E-mail already in use");
				}
			});
		}
		else if(req.body.checkType == 'mobile')
		{
            return UserModel.findOne({where: {user_mobile: value}}).then((user) => {
				if (user) {
					return Promise.reject("Mobile already in use");
				}
			});
		}
		return true;
	}),	
	(req, res) => {
		try
		{
			const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				let userData = req.body.checkValue;
				if(req.body.checkType == 'email')
				{
					return apiResponse.successResponseWithData(res,"Email id is avilable.", userData);	
				}
				else if(req.body.checkType == 'mobile')
				{
					return apiResponse.successResponseWithData(res,"Mobile no is avilable.", userData);	
				}			
			}
		}
		catch (err)
		{
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/* User Registration */
exports.register1 = [
	// Validate fields.
	body("first_name").isLength({ min: 1 }).trim().withMessage("First Name must be specified."),
	body("last_name").isLength({ min: 1 }).trim().withMessage("Last Name must be specified."),
	//body("orgnization_name").isLength({ min: 1 }).trim().withMessage("Orgnization must be specified."),
	body("tnc").isLength({ min: 1 }).trim().withMessage("Tnc must be specified."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
		return UserModel.findOne({where: {email: value}}).then((user) => {
			if(user)
			{
				return Promise.reject("User Already Exists");
			}
		});
	}),
	// Sanitize fields.
	sanitizeBody("email").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				let generatedPassword = utility.generatePassword();

				bcrypt.hash(generatedPassword,10,function(err, hash) 
				{
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							first_name: req.body.first_name,
							last_name: req.body.last_name,
							email: req.body.email,
							password: hash,
							ref_password:req.body.generatedPassword,
							is_password_change:0,
							is_subscribe:0,
							orgnization_name: req.body.orgnization_name,
							user_firebase_id:req.body.user_firebase_id?req.body.user_firebase_id:'',
							user_device_id:req.body.user_device_id?req.body.user_device_id:'',
							tnc:(req.body.s === true)?1:0
						}
					);
                    let html = "<p>Please Confirm your Account.</p><p>Password: "+generatedPassword+"</p>";
                    EmailTamplateModel.findOne({ where: { id: '4' } }).then((tamplate) => {
            var tamplate = tamplate.content;
            tamplate = tamplate.replace('title', "Please Confirm Your Account");
            tamplate = tamplate.replace('Username',req.body.first_name + ' ' + req.body.last_name);
            tamplate = tamplate.replace('Firstcontent',"Please Confirm your Account.Password: "+generatedPassword+"");
            
            user.save(function (err) {
                    	if (err) { return apiResponse.ErrorResponse(res, err); }
                    }).then(function(){                    	
	                    mailer.send(
							constants.confirmEmails.from, 
							req.body.email,
							"Account Creation on Recon 3D",
							tamplate
						).then(function(){
							var userData = userResponseUtility.getUserResponse(user);
	                    	return apiResponse.successResponseWithData(res,"Success! User created successfully.", userData);														
						}).catch(err => {
							return apiResponse.ErrorResponse(res,err);
						});
                    });	

            });
  
                    //let html = "Your File Successfully Uploaded";
                   // let html = "<p>Please Confirm your Account.</p><p>Password: "+generatedPassword+"</p>";
                    



				});
			}
		}
		catch (err)
		{
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

exports.register = [
	// Validate fields.
	body("first_name").isLength({ min: 1 }).trim().withMessage("First Name must be specified."),
	body("last_name").isLength({ min: 1 }).trim().withMessage("Last Name must be specified."),
	//body("orgnization_name").isLength({ min: 1 }).trim().withMessage("Orgnization must be specified."),
	body("tnc").isLength({ min: 1 }).trim().withMessage("Tnc must be specified."),
	body("password").trim(),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
		return UserModel.findOne({where: {email: value}}).then((user) => {
			if(user)
			{
				return Promise.reject("User Already Exists");
			}
		});
	}),
	// Sanitize fields.
	sanitizeBody("email").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				if(!req.body.password)
				{
					var generatedPassword = utility.generatePassword();
				}
				else
				{					
                	var generatedPassword = req.body.password;
				}
				
				bcrypt.hash(generatedPassword,10,function(err, hash) 
				{
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							first_name: req.body.first_name,
							last_name: req.body.last_name,
							email: req.body.email,
							password: hash,
							ref_password:generatedPassword,
							is_password_change:0,
							is_subscribe:0,
							orgnization_name: req.body.orgnization_name,
							user_firebase_id:req.body.user_firebase_id?req.body.user_firebase_id:'',
							user_device_id:req.body.user_device_id?req.body.user_device_id:'',
							tnc:(req.body.s === true)?1:0
						}
					);
					console.log(user);
                    //let html = "<p>Please Confirm your Account.</p><p>Password: "+generatedPassword+"</p>";
                    if(!req.body.password)
                    {
	                    EmailTamplateModel.findOne({ where: { id: '4' } }).then((tamplate) => {
				            var tamplate = tamplate.content;
				            var link = `${PORTAL_BASE_URL}reset-password?username=${req.body.email}&password=${generatedPassword}`;
				            tamplate = tamplate.replace('title', "Please Confirm Your Account");
				            tamplate = tamplate.replace('Username',req.body.first_name + ' ' + req.body.last_name);
				            tamplate = tamplate.replace('Firstcontent',"Please confirm your account by copying the password below and entering this into Recon-3D. You will then be prompted to create a new password.<br><br>Password: "+generatedPassword+" <br><br> Click <a href="+link+">here</a> to go back to Recon-3D");
				            
				            user.save(function (err) {
				                    	if (err) { return apiResponse.ErrorResponse(res, err); }
				                    }).then(function(){
				                    
				                    UserModel.findOne({where: {email: req.body.email}}).then(user => {
				                    	let updateDataDevice={
										user_firebase_id:req.body.user_firebase_id?req.body.user_firebase_id:'',
								        user_id:user.id?user.id:'',
								        user_device_id:req.body.user_device_id?req.body.user_device_id:'',
								        //user_device_id:req.body.user_device_id?req.body.user_device_id:'',
									    }
				                    	DeviceDetailModel.findOrCreate({where:{user_device_id:req.body.user_device_id},defaults: updateDataDevice}).then(async initiateDetails => {
								        });

				                    });	
                                    



					                    mailer.send(
											constants.confirmEmails.from, 
											req.body.email,
											//"zunedgkp@gmail.com",
											"Account Creation on Recon 3D",
											tamplate
										).then(function(){
											var userData = userResponseUtility.getUserResponse(user);
					                    	return apiResponse.successResponseWithData(res,"User created successfully.", userData);														
										}).catch(err => {
											console.log(err);
											//return apiResponse.ErrorResponse(res,err);
										});
										var userData = userResponseUtility.getUserResponse(user);
					                    return apiResponse.successResponseWithData(res,"User created successfully.", userData);
				                    });	

				        })
	                }
	                else
	                {
	                    EmailTamplateModel.findOne({ where: { id: '4' } }).then((tamplate) => {
				            var tamplate = tamplate.content;
				            tamplate = tamplate.replace('title', "Account Registered Successfully.");
				            tamplate = tamplate.replace('Username',req.body.first_name + ' ' + req.body.last_name);
				            tamplate = tamplate.replace('Firstcontent',"Please confirm your account by copying the password below and entering this into Recon-3D.");
				            
				            user.save(function (err) {
				                    	if (err) { return apiResponse.ErrorResponse(res, err); }
				                    }).then(function(){  

				                   
				                    UserModel.findOne({where: {email: req.body.email}}).then(user => {
				                    	let updateDataDevice={
										user_firebase_id:req.body.user_firebase_id?req.body.user_firebase_id:'',
								        user_id:user.id?user.id:'',
								        user_device_id:req.body.user_device_id?req.body.user_device_id:'',
								        //user_device_id:req.body.user_device_id?req.body.user_device_id:'',
									    }
				                    	DeviceDetailModel.findOrCreate({where:{user_device_id:req.body.user_device_id},defaults: updateDataDevice}).then(async initiateDetails => {
								    });

				                    });	                  	
					                    mailer.send(
											constants.confirmEmails.from, 
											req.body.email,
											//"zunedgkp@gmail.com",
											"Welcome to Recon 3D",
											tamplate
										).then(function(){
											var userData = userResponseUtility.getUserResponse(user);
					                    	return apiResponse.successResponseWithData(res,"User created successfully.", userData);														
										}).catch(err => {
											console.log(err);
											//return apiResponse.ErrorResponse(res,err);
										});
										var userData = userResponseUtility.getUserResponse(user);
					                    return apiResponse.successResponseWithData(res,"User created successfully.", userData);	
				                    });	

				        })	                	
	                }
  
                    //let html = "Your File Successfully Uploaded";
                   // let html = "<p>Please Confirm your Account.</p><p>Password: "+generatedPassword+"</p>";
                    



				});
			}
		}
		catch (err)
		{
			//throw error in json response with status 500.
			console.log('Registration Catch Block Error',err)
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

//Manual Reg Email....
exports.manual_register = [
	// Validate fields.
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified."),
	
	// Sanitize fields.
	
	// Process request after validation and sanitization.
	(req, res) => {
		try {
              UserModel.findOne({where: {email: req.body.email}}).then(userD => {
                  EmailTamplateModel.findOne({ where: { id: '4' } }).then((tamplate) => {
			            var tamplate = tamplate.content;
			            var link = `${PORTAL_BASE_URL}reset-password?username=${userD.email}&password=${userD.ref_password}`;
			            tamplate = tamplate.replace('title', "Please Confirm Your Account");
			            tamplate = tamplate.replace('Username',userD.first_name + ' ' + userD.last_name);
			            tamplate = tamplate.replace('Firstcontent',"Please confirm your account by copying the password below and entering this into Recon-3D. You will then be prompted to create a new password.<br><br>Password: "+userD.ref_password+" <br><br> Click <a href="+link+">here</a> to go back to Recon-3D");
			            
			                           	
				                    mailer.send(
										constants.confirmEmails.from, 
										userD.email,
										//"zunedgkp@gmail.com",
										"Account Creation on Recon 3D",
										tamplate
									).then(function(){
										let updateData={
											is_email_sent:'1'
										}
										UserModel.update(updateData, {where:{email : userD.email}}).then(data => {
		                                  
										})
				                    	return apiResponse.successResponseWithData(res,"User created successfully.");														
									}).catch(err => {
										return apiResponse.ErrorResponse(res,err);
									});
			                    

			        });
              });
			}
		catch (err)
		{
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];



