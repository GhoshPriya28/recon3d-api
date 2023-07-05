const db = require("../models");
//const UserModel = db.UserModel;
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,FileTaskModel:FileTaskModel,TaskListModel:TaskListModel } = db;
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
//const randtoken = require('rand-token');
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('AuthKey');
const path = require('url');
const auth = require("../middlewares/jwt");
var imageBasePath=configFile.getBaseUrl();




var upload = multer({storage: fileHelper.storage,fileFilter:fileHelper.imageFilter}).any();

//var upload2 = multer({storage: fileHelper.storage,fileFilter:fileHelper.imageFilter}).array('invoices', 12);
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

exports.filesUpload = (req, res) => {

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
        var invoiceView=constants.path.invoicesViewPath;
		array.forEach(function (item, index) {
            
            if(item.fieldname=='documents')
            {
                item.fullpath=imageBasePath+documentView+item.filename;
                allImg[index]=item;
            }
            else if(item.fieldname=='invoices')
            {
                console.log('INV');
                item.fullpath=imageBasePath+invoiceView+item.filename;
                allImg[index]=item;
            }
			
		});
		return apiResponse.successResponseWithData(res,"Files uploaded successfully .", allImg);	
	});
    

      
 }


 exports.fileTask=[
    auth,
    // Validate fields.
	body("file_size").isLength({ min: 1 }).trim().withMessage("File size must be specified."),
	//body("role").isLength({ min: 1 }).trim().withMessage("Role must be specified."),
	body("file_type").isLength({ min: 1 }).trim().withMessage("File type Must be specified."),
	body("chunks").isLength({ min: 1 }).trim().withMessage("Chunks must be specified."),
	//body("file").isLength({ min: 1 }).trim().withMessage("File must be specified."),
	function (req, res) {
        try {
            // Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				  

						var fileData = new FileTaskModel(
							{
							file_size: req.body.file_size,
                            file_type: req.body.file_type,
                            chunks: req.body.chunks,
							user_id:req.user.user_id
							}
						);
                        var listArr=[];
                        fileData.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err); }
						}).then(function(){
							
							for (var task_id = 1;  task_id<=req.body.chunks; task_id++) {
								
									var ListData = new TaskListModel(
										{
										//
										list_id: task_id,
										task_id: fileData.id,
										status: 0
										}
									);
									
									ListData.save(function (err) {
										if (err) { return apiResponse.ErrorResponse(res, err); }
									});
								
                                    listArr[task_id]=task_id;
									
								}
                               
								let taskData = {
									filesize: fileData.file_size,
									file_type:fileData.file_type,
									chunks:fileData.chunks,
									task_id:fileData.id,
									taskList:listArr
								}

								return apiResponse.successResponseWithData(res,"Task add Successfully.",taskData);
						});
				
            }
        }catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
  
}];

exports.getFile=[
    auth,
    // Validate fields.
	body("task_id").isLength({ min: 1 }).trim().withMessage("Task id must be specified."),
	//body("role").isLength({ min: 1 }).trim().withMessage("Role must be specified."),
	body("list_id").isLength({ min: 1 }).trim().withMessage("List id Must be specified."),
	
	function (req, res) {
        try {
            // Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				  
				var queryTask = {task_id : req.body.task_id,list_id:req.body.list_id};
				TaskListModel.findOne({
					where: queryTask
					}).then(taskL => {
				    let taskData = {
						task_id:taskL.task_id,
						list_id:taskL.list_id,
						file:taskL.file ? taskL.file : '',
						status:taskL.status
					};	
					return apiResponse.successResponseWithData(res,"Details.", taskData);
				
				});
            }
        }catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
}];

//Delete File...
exports.deleteFile=[
    auth,
    // Validate fields.
	body("task_id").isLength({ min: 1 }).trim().withMessage("Task id must be specified."),
	body("list_id").isLength({ min: 1 }).trim().withMessage("Task List id must be specified."),
	function (req, res) {
        try {
            // Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				  
				var queryTask = {task_id : req.body.task_id,list_id:req.body.list_id};
				TaskListModel.destroy({
					where: queryTask
					}).then(taskL => {
					return apiResponse.successResponseWithData(res,"Task Delete Successfully.");
			
				});
            }
        }catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
}];

//Update task ..
exports.uploadTaskComplete=[
    auth,
    // Validate fields.
	body("task_id").isLength({ min: 1 }).trim().withMessage("Task id must be specified."),
	body("list_id").isLength({ min: 1 }).trim().withMessage("Task List id must be specified."),
	body("status").isLength({ min: 1 }).trim().withMessage("Status must be specified."),
	function (req, res) {
        try {
            // Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				  
				var queryTask = {task_id : req.body.task_id,list_id:req.body.list_id};
				console.log(queryTask);
				var taskData =
				{
					status: req.body.status
				}
				TaskListModel.update(taskData, {
					where:queryTask
				}).catch(err => {
					return apiResponse.ErrorResponse(res, err);
				});
				return apiResponse.successResponseWithData(res,"Task updated successfully.");
            }
        }catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
}];





