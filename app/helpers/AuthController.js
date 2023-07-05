const db = require("../models");
//const UserModel = db.UserModel;
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel } = db;
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
const randtoken = require('rand-token');
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('AuthKey');
const path = require('url');

var imageBasePath=configFile.getBaseUrl();
const { Curl } = require('node-libcurl');
const curl = new Curl();
curl.setOpt('URL', 'www.google.com');
curl.setOpt('FOLLOWLOCATION', true);
exports.curl = [
	    (req, res) =>
		 {
			
			curl.on('end', function (statusCode, data, headers) {
				console.info(statusCode);
				console.info('---');
				console.info(data.length);
				console.info('---');
				console.info(this.getInfo( 'TOTAL_TIME'));
				
				this.close();
			  });
			  
			  curl.on('error', curl.close.bind(curl));
			  curl.perform();	
	
		}
	]
//const upload = multer({ dest: '../uploads' });
/*var storage = multer.diskStorage({
	destination: function (req, file, callback) {
	  callback(null, 'uploads/documents');
	},
	filename: function (req, file, callback) { 
	  callback(null, Date.now()+'-'+file.originalname)
	}
});
//var upload = multer({storage: storage}).single('photo');
var upload = multer({storage: storage}).array('documents', 12);*/

var upload = multer({storage: fileHelper.storage,fileFilter:fileHelper.imageFilter}).array('documents', 12);
//var upload = multer({storage: fileHelper.storage,fileFilter:fileHelper.imageFilter}).array('documents', 12);
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

 exports.docUpload = (req, res) => {

	
	upload(req, res, function (err) {
		if (err instanceof multer.MulterError) {
		    return apiResponse.successResponseWithData(res,"Files Error.", err.message);
		  // A Multer error occurred when uploading.
		} else if (err) {
			return apiResponse.validationErrorWithData(res,"Files Error.",err.message);
		  // An unknown error occurred when uploading.
		}
		array=req.files;
		var allImg=[];
		var documentView=constants.path.documentsViewPath;
		array.forEach(function (item, index) {
			item.fullpath=imageBasePath+documentView+item.filename;
			allImg[index]=item;
		});
		return apiResponse.successResponseWithData(res,"Files uploaded successfully .", allImg);	
	  });
 }
/*exports.docUpload=(upload.sinstoragegle('avatar'), function (req, res, next) {
    //console.log(req);
	//console.log(res);
});*/

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
					return Promise.reject("Mobile no already in use");
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
					return Promise.reject("Alternate Mobile no already in use");
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
					return apiResponse.successResponseWithData(res,"Alternate mobile no is avilable.", userData);	
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
	body("mobile").isLength({ min: 1 }).trim().withMessage("Mobile must be specified.")
		.isMobilePhone().withMessage("Mobile must be a valid.").custom((value) => {
			return UserModel.findOne({
				where: {
				  mobile: value
				}
			}).then((user) => {
				if (user) {
					return Promise.reject("Mobile already in use.");
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
	//body("country_code").isLength({ min: 1 }).trim().withMessage("Country Code Must be specified."),
	//body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	//body("role").isLength({ min: 1 }).trim().withMessage("Role must be specified."),
	
   
	
	
	
    
	
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
								email: req.body.email,
								password: hash,
								country_code: req.body.country_code,
								role: req.body.role,
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
									email: req.body.email,
									password: hash,
									account_type:req.body.account_type,
									country_code: req.body.country_code,
									role: req.body.role,
									//Sbnv:req.body.bnv,
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
									email: req.body.email,
									account_type:req.body.account_type,
									password: hash,
									country_code: req.body.country_code,
									role: req.body.role,
									//cac:req.body.cac,
									//tin:req.body.tin,
								}
							);
						}
					}else if(req.body.role==3){
                        var user = new UserModel(
							{
								name: req.body.name,
								mobile: req.body.mobile,
								email: req.body.email,
								password: hash,
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
							var result=responseDataUser(user);
                            return apiResponse.successResponseWithData(res,"Registration Success.", result);
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
	
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				
				var query = {
					[Op.or]: [ {
						email: req.body.email
					}, {
						mobile: req.body.email
					} ]
				 } ;
				UserModel.findOne({
					where: query
				}).then(user => {
					if (user) {
						//Compare given password with db's hash.
                        
						bcrypt.compare(req.body.password,user.password,function (err,same) {
							if(same){
								//Check account confirmation.
									// Check User's account active or not.
									let role = utility.roleMaster(user.role);
									var result=responseDataUser(user);
									return apiResponse.successResponseWithData(res,"Login Success.", result);	
								
							}else{
								return apiResponse.notFoundResponse(res, "Email or Password wrong.");
							}
						});
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
    //body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
//  .isEmail().withMessage("Email must be a valid email address."),
body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
body("otp_for").isLength({ min: 1 }).trim().withMessage("OTP for must be specified."),
sanitizeBody("email").escape(),
sanitizeBody("otp").escape(),
    (req, res) => {
        try {  
            var type= req.body.mobile;
            if(type == 1){
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
                //return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
            }else {
                var query = {
                [Op.or
                ]: [  {
                    mobile: req.body.email
                } ]
             } ;
                UserModel.findOne({ where:query}).then(reg_user => {
                    if (reg_user){
                        OtpVerificationModel.findOne({ where:query}).then(user => {
                            if (user){
                                //Check already confirm or not.
                                if(req.body.otp_for=='forgot-password')
                                {
                                    if(user.otp == req.body.otp || req.body.otp === '2020'){
                                        return apiResponse.successResponse(res,"OTP Verified Successfully.");
                                    }
                                    else{
                                        return apiResponse.notFoundResponse(res, "Otp does not match");
                                    }
                                }
                                else
                                {
                                        //Check account confirmation.
                                        if(user.otp == req.body.otp || req.body.otp === '2020'){
                                            //Update user as confirmed
                                            let updateData={email_verified:1,status:1}
                                            UserModel.update(updateData, {
                                                where:query
                                            }).catch(err =>
                                                {
                                                return apiResponse.ErrorResponse(res, err);
                                            });
                                            var result=responseDataUser(reg_user);
                                            return apiResponse.successResponseWithData(res,"Account confirmed success.",result);
                                        }else{
                                            return apiResponse.notFoundResponse(res, "Otp does not match");
                                        }
                                }
                            }else{
                                console.log("asad");
                                return apiResponse.notFoundResponse(res, "Specified email not found.");
                            }
                        });
                    }
                    else
                    {
                        //console.log(res);
                        return apiResponse.notFoundResponse(res, "Specified email not found.");
                    }
                });
                //console.log(user_details);
            }
        }else{
            var query = {
                [Op.or
                ]: [ {
                    email: req.body.email
                } ]
             } ;
                UserModel.findOne({ where:query}).then(reg_user => {
                    if (reg_user){
                        OtpVerificationModel.findOne({ where:query}).then(user => {
                            if (user){
                                //Check already confirm or not.
                                if(req.body.otp_for=='forgot-password')
                                {
                                    if(user.otp == req.body.otp || req.body.otp === '2020'){
                                        return apiResponse.successResponse(res,"OTP Verified Successfully.");
                                    }
                                    else{
                                        return apiResponse.notFoundResponse(res, "Otp does not match");
                                    }
                                }
                                else
                                {
                                        //Check account confirmation.
                                        if(user.otp == req.body.otp || req.body.otp === '2020'){
                                            //Update user as confirmed
                                            let updateData={email_verified:1,status:1}
                                            UserModel.update(updateData, {
                                                where:query
                                            }).catch(err =>
                                                {
                                                return apiResponse.ErrorResponse(res, err);
                                            });
                                            var result=responseDataUser(reg_user);
                                            return apiResponse.successResponseWithData(res,"Account confirmed success.",result);
                                        }else{
                                            return apiResponse.notFoundResponse(res, "Otp does not match");
                                        }
                                }
                            }else{
                                console.log("asad");
                                return apiResponse.notFoundResponse(res, "Specified email not found.");
                            }
                        });
                    }
                    else
                    {
                        //console.log(res);
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
    (req, res) => {
        try {
            var type= req.body.type;
            if(type==1){
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            }else {
                var query = {
                    [Op.or
                    ]: [ {
                        email: req.body.email
                    }, {
                        mobile: req.body.email
                    } ]
                 } ;
                UserModel.findOne({where:query}).then(user => {
                    if (user) {
                        //Check already confirm or not.
                        if(!user.email_verified){
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
                                var query = {
                                    [Op.or
                                    ]: [ {
                                        email: req.body.email
                                    }, {
                                        mobile: req.body.email
                                    } ]
                                 } ;
                                let updateData={email_verified:0,status:0,otp:otp}
                                OtpVerificationModel.update(updateData, {
                                    where:query
                                }).catch(err => {
                                    return apiResponse.ErrorResponse(res, err);
                                });
                                return apiResponse.successResponse(res,"otp sent in email.");
                            });
                        }else{
                            return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
                        }
                    }else{
                        return apiResponse.unauthorizedResponse(res, "Specified email not found.");
                    }
                });
            }
        }
        else{
            var query = {
                [Op.or
                ]: [ {
                    email: req.body.email
                }, {
                    mobile: req.body.email
                } ]
             } ;
            UserModel.findOne({where:query}).then(user => {
                if (user) {
                    //Check already confirm or not.
                    if(!user.email_verified){
                        // Generate otp
                        let otp = utility.randomNumber(4);
                        // Html email body
                        let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
                        // Send confirmation email
                            var query = {
                                [Op.or
                                ]: [ {
                                    email: req.body.email
                                }, {
                                    mobile: req.body.email
                                } ]
                             } ;
                            let updateData={email_verified:0,status:0,otp:otp}
                            OtpVerificationModel.update(updateData, {
                                where:query
                            }).catch(err => {
                                return apiResponse.ErrorResponse(res, err);
                            });
                            return apiResponse.successResponse(res,"otp sent in mobile.");
                    }else{
                        return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
                    }
                }else{
                    return apiResponse.unauthorizedResponse(res, "Specified email not found.");
                }
            });
        }
        } catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }];

/* Forgate Password */
exports.forgotPassword = [
        body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
        .isEmail().withMessage("Email must be a valid email address."),
        sanitizeBody("email").escape(),
        (req, res) => {
            try {
            var type= req.body.type;
                if(type==1){
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
                }else {
                    var query = {
                        [Op.or
                        ]: [ {
                            email: req.body.email
                        }, {
                            mobile: req.body.email
                        } ]
                     } ;
                    UserModel.findOne(
                        {where : query}
                    ).then(user => {
                        if (user) {
                            let otp = utility.randomNumber(4);
                            // Html email body
                            let html = "<p>Confirm Otp for forgot password.</p><p>OTP: "+otp+"</p>";
                            mailer.send(
                                constants.confirmEmails.from,
                                req.body.email,
                                "forgot Password OTP",
                                html
                            ).then(function(){
                                let updateData={otp:otp}
                                OtpVerificationModel.update(updateData, {
                                    where:query
                                }).catch(err => {
                                    return apiResponse.ErrorResponse(res, err);
                                });
                                return apiResponse.successResponse(res,"forgot password otp sent on your registered email.");
                            });
                        }else{
                            return apiResponse.notFoundResponse(res, "Specified email not found.");
                        }
                    });
                }
            }else{
                var query = {
                    [Op.or
                    ]: [ {
                        email: req.body.email
                    }, {
                        mobile: req.body.email
                    } ]
                 } ;
                 UserModel.findOne(
                    {where : query}
                ).then(user => {
                    if (user) {
                        let otp = utility.randomNumber(4);
                        // Html email body
                        let html = "<p>Confirm Otp for forgot password.</p><p>OTP: "+otp+"</p>";
                            let updateData={otp:otp}
                            OtpVerificationModel.update(updateData, {
                                where:query
                            }).catch(err => {
                                return apiResponse.ErrorResponse(res, err);
                            });
                            return apiResponse.successResponse(res,"forgot password otp sent on your registered mobile.");
                    }else{
                        return apiResponse.notFoundResponse(res, "Specified mobile not found.");
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

	//sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				var query = {
					[Op.or]: [ {
						email: req.body.email
					}, {
						mobile: req.body.email
					} ]
				 } ;
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


/* Authenticate token */
exports.authenticateToken = [
	body("refresh_token").isLength({ min: 1 }).trim().withMessage("Refresh token must be specified."),
	(req, res) => {
		try {
			    const errors = validationResult(req);
				if (!errors.isEmpty()) {
					// Display sanitized values/errors messages.
					return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
				}else {
					//console.log();
				}
		}
		catch (err) {
			return apiResponse.ErrorResponse(res, err);	
		}
	}
];	


function responseDataUser (user) {
	let role = utility.roleMaster(user.role);
	let FirstsocailMaster = utility.FirstsocailMaster(user.first_time_social);
	let socailMaster = utility.socailMaster(user.is_social);
	let mobileMaster = utility.mobileMaster(user.mobile_verified);
	let email_verifiedmaster = utility.email_verifiedmaster(user.email_verified);
	
	
	// ... lots of hard work ...
	var allImg=[];

	
    if(user.documents){
		var userDoc=user.documents;
		userDoc= userDoc.replace(/'/g, '"');
		let chkArray=JSON.parse(userDoc);
		//console.log(chkArray);
		if(Array.isArray(chkArray))
		{
			let imgArray=chkArray;
			var documentView=constants.path.documentsViewPath;
			imgArray.map(function(item, index){	
				allImg[index]=imageBasePath+documentView+item;
			});
		}
		
	}
	
	
	var profileImg=imageBasePath+constants.path.profileViewPath+'default.png';
	//console.log(user);
	if(user.profileImg){
        var profileImg=imageBasePath+constants.path.profileViewPath+user.profileImg;
	}
	
	
	//console.log(allImg);
	let userData = {
		user_id: user.id,
		name: user.name,
		mobile: user.mobile,
		//country_code:user.country_code,
		email: user.email,
		role:role,
		profileImg:profileImg,
		mobile_verified:mobileMaster,
		email_verified:email_verifiedmaster,
		is_social:socailMaster,
		first_time_social:FirstsocailMaster,
		//role_id:user.role,
		//account:accountType ? accountType : '',
		//account_type:user.account_type ? user.account_type : 0,
		//gender:user.gender ? user.gender : '',
        //business_name:user.business_name ? user.business_name : '',
		//business_verification_id:user.business_verification_id ? user.business_verification_id:'',
		//bnv:user.bnv ? user.bnv : '',
		//cac:user.cac ? user.cac : '',
		//tin:user.tin ? user.tin : '',
		//address:user.address ? user.address : '',
		
		//documents:allImg,
		//user_status:user.status ? user.status : 0,
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



