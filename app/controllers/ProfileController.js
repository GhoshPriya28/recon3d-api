const db = require("../models");
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,RefrenceMethod:RefrenceMethod,CityModel:CityModel } = db;
const Op = db.Sequelize.Op;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const multer  = require('multer');
const express=require('express');
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
const auth = require("../middlewares/jwt");
var fs = require("fs");
const userResponseUtility = require("../helpers/userResponseUtility");

exports.profileDetails = [
	auth,
	function (req, res) {
        try
        {
        	var userId = parseInt(req.query.userId,10);
        	if(userId)
        	{
	        	UserModel.findOne({where: {id : userId}}).then(user => {
	        		if(user)
	        		{
	        			if(user.user_status==2)
	        			{
	        				return apiResponse.notFoundResponse(res, "Invalid User.");
	        			}
	        			let version=req.query.version?req.query.version:"";
		        		var result = userResponseUtility.getUserResponse(user,'profile',version);
		        		return apiResponse.successResponseWithData(res,"Profile Details.", result);
		        	}
		        	else
		        	{
		        		return apiResponse.notFoundResponse(res, "Oops this user id not found within our system.");
		        	}
	        	});
	        }
	        else
	        {
	        	return apiResponse.notFoundResponse(res, "Provide a user id.");
	        }
        }
        catch (err)
        {
        	return apiResponse.ErrorResponse(res, err);
        }
    }
];

exports.updateProfile = [
	// auth,
    // Validate fields.
    body("userId").isLength({ min: 1 }).trim().withMessage("User Id must be specified."),
    // body("email").isLength({ min: 1 }).trim().withMessage("Role must be specified."),
    // body("email").isLength({ min: 1 }).trim().withMessage("Role must be specified."),

    function (req, res)
    {
    	try
    	{
            const errors = validationResult(req);
            var userData = {};
            if (!errors.isEmpty())
            {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());				
			}
			else
			{	

				

				if(req.body.fullName != "")
				{
					const myArray = req.body.fullName.split(" ");
					if(myArray[0])
					{
						userData['first_name'] = myArray[0];
					}
					if(myArray[1])
					{
						userData['last_name'] = myArray[1];
					}
					
				}

				if(req.body.email != "")
				{
					userData['email'] = req.body.email;
				}

				if(req.body.profileImage != "")
				{
					userData['user_profile_pic'] = req.body.profileImage;
				} 
				var query = {id : req.body.userId};
                UserModel.findOne({ where:query}).then(async reg_user => {
                	if(reg_user)
                	{
                    	await UserModel.update(userData, {where:query}).catch(err => {
                    		return apiResponse.ErrorResponse(res, err);
                    	});                  	
	                    UserModel.findOne({where: query}).then(userDetail => {
	                    	if(userDetail)
	                    	{
	                    		var result = userResponseUtility.getUserResponse(userDetail,'profile');
	                    		return apiResponse.successResponseWithData(res,"Profile updated successfully.", result);
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
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

exports.deleteAccount = [
	// auth,
    // Validate fields.
    body("userId").isLength({ min: 1 }).trim().withMessage("User Id must be specified."),
    // body("email").isLength({ min: 1 }).trim().withMessage("Role must be specified."),
    // body("email").isLength({ min: 1 }).trim().withMessage("Role must be specified."),

    function (req, res)
    {
    	try
    	{
            const errors = validationResult(req);
            var userData = {};
            if (!errors.isEmpty())
            {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());				
			}
			else
			{	
                userData['user_status'] = 2;

				var query = {id : req.body.userId};
                UserModel.findOne({ where:query}).then(async reg_user => {
                	if(reg_user)
                	{
                		userData['user_deleted_email'] = reg_user.email;
                		userData['email'] = '';
                    	await UserModel.update(userData, {where:query}).catch(err => {
                    		return apiResponse.ErrorResponse(res, err);
                    	});                  	
	                   
	                     return apiResponse.successResponseWithData(res,"Profile has been deleted successfully.");  
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
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

//Update Firebase id..

exports.updateFirebaseId = [
	async (req, res) => {
		try {
			var userFirebaseId = { user_firebase_id: req.body.user_firebase_id }
			console.log(userFirebaseId)
			var userId = { id: req.body.userId };
			UserModel.findOne({ where: userId }).then(async user => {
				if (user) {
					await UserModel.update(userFirebaseId, { where: userId }).then(userdata => {
						if (userdata) {
							UserModel.findOne({ where: userId }).then(userDetail => {
								if (userDetail) {
									return apiResponse.successResponseWithData(res, "Updated Successfully.")
								}
							});
						}
						else {
							return apiResponse.notFoundResponse(res, "Not Updated")
						}
					});
				}
				else {
					return apiResponse.notFoundResponse(res, "Invalid User.");
				}
			})
		} catch {
			return apiResponse.notFoundResponse()
		}
	}
]
