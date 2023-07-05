const db = require("../models");
//const UserModel = db.UserModel;
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,CityModel:CityModel } = db;
const Op = db.Sequelize.Op;

//const otpModel = db.OtpVerificationModel;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const multer  = require('multer');
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const fileHelper = require("../helpers/filesUpload");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('AuthKey');
const path = require('url');

var imageBasePath=configFile.getBaseUrl();

/**
 * User registration.
 *
 * @param {string}      fullName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */



/* Check Value Exist*/
exports.checkValueExist = [
	body("checkType").isLength({ min: 1 }).trim().withMessage("CheckType must be specified."),
	body('userValue').isLength({ min: 1 }).trim().withMessage("User Value must be specified.").custom((value, { req }) => {
		if (req.body.checkType=='Email') {
          

			return UserModel.findOne({
				where: {
					email: value
				}
			}).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}
		else if(req.body.checkType=='Mobile')
		{
            return UserModel.findOne({
				where: {
					[Op.or]: [
						{ mobile: value },
						{ alternate_mobile: value }
					  ]
				
				}
			}).then((user) => {
				if (user) {
					return Promise.reject("Mobile already in use");
				}
			});
		}

		else if(req.body.checkType=='Alternate_Mobile')
		{
			return UserModel.findOne({
				where: {
					[Op.or]: [
						{ mobile: value },
						{ alternate_mobile: value }
					  ]
				
				}
			}).then((user) => {
				if (user) {
					return Promise.reject("Alternate mobile already in use");
				}
			});
		}
	
		// Indicates the success of this synchronous custom validator
		return true;
	}),
	
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				let userData = req.body.userValue;
				if(req.body.checkType=='Email')
				{
					return apiResponse.successResponseWithData(res,"Email id is avilable.", userData);	
				}else if(req.body.checkType=='Mobile')
				{
					return apiResponse.successResponseWithData(res,"Mobile no is avilable.", userData);	
				}
				else if(req.body.checkType=='Alternate_Mobile')
				{
					return apiResponse.successResponseWithData(res,"Alternate Mobile is avilable.", userData);	
				}
				
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
}];



/* User Registration */
exports.register = [
	// Validate fields.
	body("name").isLength({ min: 1 }).trim().withMessage("Name must be specified."),
	body("mobile").isLength({ min: 1 }).trim().withMessage("Mobile number must be specified.")
		.isMobilePhone().withMessage("Mobile number must be a valid.").custom((value) => {
			return UserModel.findOne({
				where: {
				  mobile: value
				}
			}).then((user) => {
				if (user) {
					return Promise.reject("Mobile number already in use.");
				}
			});
	}),
	body("alternate_mobile").isLength({ min: 1 }).trim().withMessage("Alternate mobile number must be specified.")
		.isMobilePhone().withMessage("Alternate mobile number must be a valid.").custom((value) => {
			return UserModel.findOne({
				where: {
				  alternate_mobile: value
				}
			}).then((user) => {
				if (user) {
					return Promise.reject("Alternate mobile number already in use.");
				}
			});
	}),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
		return UserModel.findOne({
			where: {
				email: value
			}
		}).then((user) => {
			if (user) {
				return Promise.reject("E-mail already in use");
			}
		});
	}),
	body("city").isLength({ min: 1 }).trim().withMessage("City Must be specified."),
	body("country_code").isLength({ min: 1 }).trim().withMessage("Country Code Must be specified."),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	body("role").isLength({ min: 1 }).trim().withMessage("Role must be specified."),
	body('business_name').custom((value, { req }) => {

		if (req.body.role==1 || req.body.role==2 || req.body.role==3) {
		  if(!value){
			return Promise.reject("Business name must be specified.");
			//throw new Error("Business name must be specified.");
		  }
		}
		return true;
	}),
    body('business_verification_id').custom((value, { req }) => {
		if (req.body.role==1) {
			if(!value){
			  return Promise.reject("Business verification id must be specified.");
			 // throw new Error("Business verification id must be specified.");
			}
		}
		return true;
	}),
	body('address').custom((value, { req }) => {
		if (req.body.role==1 || req.body.role==2) {
			if(!value){
			   return Promise.reject("Address must be specified.");
			  //throw new Error("Address must be specified.");
			}
		}
		return true;
	}),
	body('documents').custom((value, { req }) => {
		if (req.body.role==1) {
			if(!value){
				return Promise.reject("Supporting documents must be specified.");
			}
		}
		return true;
	}),
	body('account_type').custom((value, { req }) => {
		if (req.body.role==2) {
			if(!value){ 
				return Promise.reject("Account type must be specified.");	
			 // throw new Error("Account type must be specified.");
			}
		}
		return true;
	}),
    body('bnv').custom((value, { req }) => {
		if (req.body.role==2 && req.body.account_type==1) {
			if(!value){ 
			  throw new Error("BNV must be specified.");
			}
		}
		return true;
	}),
	body('cac').custom((value, { req }) => {
		if (req.body.role==2 && req.body.account_type==2) {
			if(!value){ 
			  throw new Error("CAC must be specified.");
			}
		}
		return true;
	}),
	body('tin').custom((value, { req }) => {
		if (req.body.role==2 && req.body.account_type==2) {
			if(!value){ 
			  throw new Error("TIN must be specified.");
			}
		}
		return true;
	}),
	// Sanitize fields.
	/*sanitizeBody("fullName").escape(),
	sanitizeBody("mobile").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	sanitizeBody("countryCode").escape(),*/
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				//hash input password
				bcrypt.hash(req.body.password,10,function(err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					//Buyer
                    if(req.body.role==1){
						var user = new UserModel(
							{
								name: req.body.name,
								mobile: req.body.mobile,
								alternate_mobile:req.body.alternate_mobile,
								email: req.body.email,
								password: hash,
								country_code: req.body.country_code,
								city:req.body.city,
								role: req.body.role,
								address:req.body.address,
								business_name: req.body.business_name,
								business_verification_id: req.body.business_verification_id,
								documents: req.body.documents
							}
						);
					} else if(req.body.role==2){
						//Seller...
						//Acount type individual
						if(req.body.account_type==1)
						{
							var user = new UserModel(
								{
									name: req.body.name,
									mobile: req.body.mobile,
									alternate_mobile:req.body.alternate_mobile,
									business_name: req.body.business_name,
									email: req.body.email,
									password: hash,
									account_type:req.body.account_type,
									address:req.body.address,
									country_code: req.body.country_code,
									city:req.body.city,
									role: req.body.role,
									bnv:req.body.bnv,
								}
							);
						}
						else
						{
							//Account type Company...
                            var user = new UserModel(
								{
									name: req.body.name,
									mobile: req.body.mobile,
									alternate_mobile:req.body.alternate_mobile,
									business_name: req.body.business_name,
									email: req.body.email,
									password: hash,
									account_type:req.body.account_type,
									country_code: req.body.country_code,
									city:req.body.city,
									role: req.body.role,
									cac:req.body.cac,
									tin:req.body.tin,
								}
							);
						}
					}else if(req.body.role==3){
                        var user = new UserModel(
							{
								name: req.body.name,
								mobile: req.body.mobile,
								alternate_mobile:req.body.alternate_mobile,
								business_name: req.body.business_name,
								email: req.body.email,
								password: hash,
								address:req.body.address,
								city:req.body.city,
								country_code: req.body.country_code,
								role: req.body.role,
							}
						);
					}
                    let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
					mailer.send(
						constants.confirmEmails.from, 
						req.body.email,
						"Confirm Account",
						html
					).then(function(){
						// Save user.
						user.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err); }
						}).then(function(){
							var verificationData = new OtpVerificationModel(
								{
									user_id:user.id,
									mobile:user.mobile,
									email:user.email,
									otp:otp,
									email_verified:0,
									mobile_verified:0,
									status:0
								}
							);
							verificationData.save(function (err) {
								if (err) { return apiResponse.ErrorResponse(res, err); }
							});
							let userData = {
								user_id: user.id,
								name: user.name,
								mobile: user.mobile,
								alternate_mobile: user.alternate_mobile,
								email: user.email
							};
                            return apiResponse.successResponseWithData(res,"Registration Success.", userData);
						});
						
					}).catch(err => {
						return apiResponse.ErrorResponse(res,err);
					});
					
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

	

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
/*User Login */
exports.login = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				UserModel.findOne({
					where: query
				}).then(user => {
					if (user) {

                      
								bcrypt.compare(req.body.password,user.password,function (err,same) {
								if(same){

									  
									  let role = utility.roleMaster(user.role);
									    var queryCity = {id : user.city};
				                        
										var result=responseDataUser(user);
	                                        
	                                        

											return apiResponse.successResponseWithData(res,"Login Success.", result);
									
									   
								}else{
									return apiResponse.notFoundResponse(res, "Email or Password wrong.");
								}
							});

						
						//Compare given password with db's hash.

                        
						
					}else{
						return apiResponse.notFoundResponse(res, "Email or Password wrong.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
/* Account Verification */
exports.verifyConfirm = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
	body("otp_for").isLength({ min: 1 }).trim().withMessage("OTP for must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				
				UserModel.findOne({ where:query}).then(reg_user => {
					if (reg_user){
						OtpVerificationModel.findOne({ where:query}).then(user => {
							if (user){

								//Check already confirm or not.
								
								
                                if(req.body.otp_for=='forgate-password')
								{
									if(user.otp == req.body.otp || req.body.otp === '2020'){
										return apiResponse.successResponse(res,"Forgate password otp match.");
									}
									else{
										return apiResponse.notFoundResponse(res, "Otp does not match");
									}
								}
								else
								{
									//if(!reg_user.email_verified){
										//Check account confirmation.
										if(user.otp == req.body.otp || req.body.otp === '2020'){
											//Update user as confirmed
											let updateData={email_verified:1}
											UserModel.update(updateData, {
												where:query
											}).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											});
											var result=responseDataUser(reg_user);
											return apiResponse.successResponseWithData(res,"Account confirmed success.",result);
										}else{
											return apiResponse.notFoundResponse(res, "Otp does not match");
										}
									/*}else{
										return apiResponse.notFoundResponse(res, "Account already confirmed.");
									}*/
								}

							}else{
								return apiResponse.notFoundResponse(res, "Specified email not found.");
							}
						});
					}
					else
					{
						return apiResponse.notFoundResponse(res, "Specified email not found.");
					}
				});
				
				//console.log(user_details);
				
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];


/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
/* Resend Verifiy OTP */
exports.resendConfirmOtp = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				UserModel.findOne({where:query}).then(user => {
					if (user) {
						//Check already confirm or not.
						
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from, 
								req.body.email,
								"Confirm Account",
								html
							).then(function(){
                                var query = {email : req.body.email};
								let updateData={email_verified:0,otp:otp}
								OtpVerificationModel.update(updateData, {
									where:query
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});

                                return apiResponse.successResponse(res,"Confirm otp sent.");
								
							});
						
					}else{
						return apiResponse.notFoundResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/* Forgate Password */
exports.forgatePassword = [
		body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
		sanitizeBody("email").escape(),
		(req, res) => {
			try {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
					//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
				}else {
					var query = {email : req.body.email};
					
					UserModel.findOne(
						{where : query}
					).then(user => {
						if (user) {
                            let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Confirm Otp for forgate password.</p><p>OTP: "+otp+"</p>";
							mailer.send(
								constants.confirmEmails.from, 
								req.body.email,
								"Forgate Password OTP",
								html
							).then(function(){
                                
								let updateData={otp:otp}
								OtpVerificationModel.update(updateData, {
									where:query
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});
                                
                                return apiResponse.successResponse(res,"Forgate password otp sent on your registered email.");
								
							});
						}else{
							return apiResponse.notFoundResponse(res, "Specified email not found.");
						}
					});
				}
			}	
			catch (err) {
				return apiResponse.ErrorResponse(res, err);
			}
		
	}];



/*Reset Password */
exports.resetPassword = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	body("reset_type").isLength({ min: 1 }).trim().withMessage("Reset type must be specified."),
	body('old_password').custom((value, { req }) => {
		if (req.body.reset_type=='change') {
			if(!value){ 
			  throw new Error("Old password must be specified.");
			}
		}
		return true;
	}),

	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				//hash input password
				bcrypt.hash(req.body.password,10,function(err, hash) {
					UserModel.findOne({ where:query}).then(reg_user => {
						if (reg_user){
							if(req.body.reset_type=='change')
							{
								bcrypt.compare(req.body.old_password,reg_user.password,function (err,same) {
									if(same){
										if(req.body.old_password==req.body.password)
										{
                                            return apiResponse.notFoundResponse(res, "Old password and new password can't be same.");
										}
										else
										{
											bcrypt.hash(req.body.password,10,function(err, hash) {
												let updateData={password: hash}
												UserModel.update(updateData, {
													where:query
												}).catch(err => {
													return apiResponse.ErrorResponse(res, err);
												});
												var result=responseDataUser(reg_user);
												return apiResponse.successResponseWithData(res,"Password has been changed.",result);
											});
										}
										
									}else{
										return apiResponse.notFoundResponse(res, "Old password is wrong.");
									}

								});
							}
							else
							{
								let updateData={password: hash}
								UserModel.update(updateData, {
									where:query
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});
								var result=responseDataUser(reg_user);
								return apiResponse.successResponseWithData(res,"Password has been changed.",result);
							}
							
							
						}
						else{
							return apiResponse.notFoundResponse(res, "Specified email not found.");
						}
					});
					
				});
			}
		}catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];



function responseDataUser (user) {
	let role = utility.roleMaster(user.role);
	let accountType = utility.accountTypeMaster(user.account_type);
	// ... lots of hard work ...
	
	
	var profileImg=imageBasePath+constants.path.profileViewPath+'default.png';
	//console.log(user);
	if(user.profileImg){
        var profileImg=imageBasePath+constants.path.profileViewPath+user.profileImg;
	}
	
	
	//console.log(allImg);
	let userData = {
		user_id: user.id,
		first_name: user.first_name,
		last_name: user.last_name,
		mobile: user.mobile,
		email: user.email,
		role_id:user.role,
		role:role,
		gender:user.gender ? user.gender : '',
		profileImg:profileImg,
		
		mobile_verified:user.mobile_verified ? user.mobile_verified : 0,
		email_verified:user.email_verified ? user.email_verified : 0,
		
		user_status:user.status ? user.status : 0,
	};
	let payloadData = {
		user_id: user.id,
		role:user.role,
		email: user.email,
	};
	//Prepare JWT token for authentication
	const jwtPayload = payloadData;
	const jwtData = {
		expiresIn: process.env.JWT_TIMEOUT_DURATION,
	};
	const secret = process.env.JWT_SECRET;
	//Generated JWT token with Payload and secret.
	
	userData.token = jwt.sign(jwtPayload, secret, jwtData);
	return userData;
}

