require('dotenv').config();
const { BASE_URL } = process.env;
const db = require("../models");
//const UserModel = db.UserModel;
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,FileTaskModel:FileTaskModel,TaskListModel:TaskListModel } = db;
const Op = db.Sequelize.Op;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
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
const paths = require('path');
const auth = require("../middlewares/jwt");
var imageBasePath=configFile.getBaseUrl();
const { fsMerge } = require('split-chunk-merge');
const fs = require('fs');     
const uploadFile = require("../middlewares/upload");

const S3 = require('aws-sdk/clients/s3');
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

/* Initiate Task */
exports.initiateTask = [
	// Validate fields.
	body("userId").isLength({ min: 1 }).trim().withMessage("User Id must be specified."),
	body("fileSize").isLength({ min: 1 }).trim().withMessage("File Size must be specified."),
	body("fileType").isLength({ min: 1 }).trim().withMessage("File Type must be specified."),
	body("totalChunks").isLength({ min: 1 }).trim().withMessage("Total Chunk must be specified."),
	body("fileExt").isLength({ min: 1 }).trim().withMessage("File Extension must be specified."),
	body("totalFilesToUpload").isLength({ min: 1 }).trim().withMessage("Total Number of Files must be specified."),
	
	// Process request after validation and sanitization.
	async(req, res) => {
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
				await FileTaskModel.create({initiate_id:utility.randomNumber(8),user_id:req.body.userId,file_size:req.body.fileSize,file_type:req.body.fileType,chunks:req.body.totalChunks,file_ext:req.body.fileExt,total_files:req.body.totalFilesToUpload}).then(initiateId => {
					let initiateData = {initiateId:initiateId.initiate_id.toString()};
					return apiResponse.successResponseWithData(res,"Task Created Successfuly.",initiateData);
				}).catch(function(error) {
				  return apiResponse.notFoundResponse(res, error);
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

/* Upload File */
exports.filesUpload = async (req, res) => {
  	try
  	{
	    await uploadFile(req, res);
	    if (req.file == undefined) {
	    	return apiResponse.validationErrorWithData(res,"Please upload a file!");
	    }
	    return apiResponse.successResponseWithData(res,"File Uploaded Successfuly.",req.file.originalname);
  	}
  	catch (err)
  	{
	    if(err.code == "LIMIT_FILE_SIZE")
	    {
	      return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
	    }
    	return apiResponse.ErrorResponse(res, `Could not upload the file: ${req.file.originalname}. ${err}`);
  	}
};

/* Create Chunk Task */
exports.createTask = [
	body("uploadId").isLength({ min: 1 }).trim().withMessage("Upload Id must be specified."),
	body("chunkIndex").isLength({ min: 1 }).trim().withMessage("Chunk Index must be specified."),
	body("fileName").isLength({ min: 1 }).trim().withMessage("File Name must be specified."),
	body("totalChunks").isLength({ min: 1 }).trim().withMessage("Total Chunks must be specified."),
	body("initiateId").isLength({ min: 1 }).trim().withMessage("Initate Id must be specified."),
	
	async(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty())
			{
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				let initiateId = req.body.initiateId;
				let chunkIndex = req.body.chunkIndex;
				let fileName = req.body.fileName;
				let totalChunks = req.body.totalChunks;
				let uploadId = req.body.uploadId;

				FileTaskModel.findOne({where: {initiate_id : initiateId}}).then(initiatorDetails => {
					if(!initiatorDetails)
					{
						return apiResponse.notFoundResponse(res, "Oops this initiate id not found within our system.");
					}
					else
					{
						if(initiatorDetails.chunks == initiatorDetails.left_chunk)
						{
							var status = '';
							switch(initiatorDetails.internal_status) {
							  case 1:
							    status = 'Pending'
							    break;
							  case 2:
							    status = 'Completed'
							    break;
							  default:
							    status = 'Initiate'
							}
							return apiResponse.notFoundResponse(res,"Task is "+status);
						}
						else
						{
							TaskListModel.create({
								list_id:utility.randomNumber(8),
								task_id:initiateId,
								file:fileName,
								upload_id:uploadId,
								chunk_index:chunkIndex,
								status:0
							}).then(fileDetails => {
								FileTaskModel.update({left_chunk:initiatorDetails.chunks-1},{where: {initiate_id: initiateId}}).then(TaskDetails => {
									TaskListModel.findAndCountAll({attributes: ['file'],where: {task_id: initiateId}}).then(result => {	

										if(result.count == initiatorDetails.chunks)
										{
											var inputData = [];
											var results = result.rows;
											results.forEach((element,index) => {
									            inputData.push(element.file);
									        });
									        console.log(inputData)
											const inputPath = paths.join("./uploads/3d-requests/")
											const outputPath = paths.join("./uploads/3d-requests/merges/", initiateId+"-merge-file"+initiatorDetails.file_ext)
											const inputPathList = inputData.map((item, index) => {
												console.log('item',item)
											  return inputPath + item
											});
											 
											fsMerge(inputPathList, outputPath).then(response => {
											  	console.log('file',response)
											  	const fileContent = fs.readFileSync(outputPath)
											  	console.log(fileContent)
											  	// var s3FileUrl = uploadFileToS3(outputPath,initiateId+"-merge-file.mp4",initiateId+"-merge-file.mp4");
											  	uploadFileToS3(fileContent,initiateId+"-merge-file"+initiatorDetails.file_ext,initiateId+"-merge-file"+initiatorDetails.file_ext).then(s3FileUrl => {
											  		console.log(s3FileUrl.Location);
											  		FileTaskModel.update({s3_file_url:s3FileUrl.Location},{where: {initiate_id: initiateId}}).then(TaskDetails => {
											  			let fileData = {taskId:fileDetails.task_id,FileName:fileDetails.file,S3FileUrl:s3FileUrl.Location};
														return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
											  		})
											  	})
											});											
										}										
										else
										{
											let fileData = {taskId:fileDetails.task_id,FileName:fileDetails.file,S3FileUrl:""};
											return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
										}
									});
								}).catch(function(error) {
								  return apiResponse.notFoundResponse(res, error);
								});
							}).catch(function(error) {
							  return apiResponse.notFoundResponse(res, error);
							});
						}
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

// get file
exports.getTaskDetails = [
	//auth,	
	function (req, res)
	{
		try{
            // Extract the validation errors from a request.
            var userId = parseInt(req.query.userId,10);
            if (!userId)
            {
				return apiResponse.notFoundResponse(res, "Provide a initiate id.");
			}
			else
			{
				var initiateData = [];
				var queryTask = {user_id:userId};
				FileTaskModel.findAndCountAll({where: queryTask}).then(fileDetails => {
					if(fileDetails.count > 0)
					{
						fileDetails.rows.forEach((element,index) => {
							let initiateDataa = {
								initiateId:element.initiate_id,
								userId:element.user_id,
								fileSize:element.file_size ? element.file_size : '',
								fileType:element.file_type ? element.file_type : '',
								fileExt:element.file_ext ? element.file_ext : '',
								totalChunks:element.chunks ? element.chunks : '',
								leftChunks:element.left_chunk ? element.left_chunk : '',
								s3FileUrl:element.s3_file_url ? element.s3_file_url : '',
								file3dUrl:element.s3_3d_url ? element.s3_3d_url : '',
								status:(element.status == 0) ? 'Initiate':((element.status == 1)? 'Pending':((element.status == 2)?'Completed':''))
							};

							initiateData.push(initiateDataa);
						});						
						return apiResponse.successResponseWithData(res,"File Details.", initiateData);
					}
					else
					{
						return apiResponse.successResponseWithData(res,"Data Not Found.", initiateData);
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

// delete file
exports.deleteFile = [
	auth,
    body("taskId").isLength({ min: 1 }).trim().withMessage("Task id must be specified."),
    body("listId").isLength({ min: 1 }).trim().withMessage("Task List id must be specified."),
    function (req, res)
    {
    	try
    	{
            // Extract the validation errors from a request.
            const errors = validationResult(req);
            if (!errors.isEmpty())
            {
				// Display sanitized values/errors messages.
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				var queryTask = {task_id : req.body.taskId,list_id:req.body.listId};
				TaskListModel.destroy({
					where: queryTask
				}).then(taskL => {
					return apiResponse.successResponseWithData(res,"Task Delete Successfully.");
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

// task status
exports.uploadTaskComplete = [
	auth,
    body("taskId").isLength({ min: 1 }).trim().withMessage("Task id must be specified."),
    body("listId").isLength({ min: 1 }).trim().withMessage("Task List id must be specified."),
    body("status").isLength({ min: 1 }).trim().withMessage("Status must be specified."),

    function (req, res)
    {
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
				var queryTask = {task_id : req.body.taskId,list_id:req.body.listId};
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
		}
		catch (err)
		{
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

const uploadFileToS3 = async (buffer, name, type) => {
	const params = {
		ACL: 'private',
		StorageClass : 'STANDARD',
		Body: buffer,
		Bucket: bucketName,
		// ContentType: type.mime,
		//Key: `${name}.${type.ext}`		
		Key: `${name}`
	};
	try {
    	const stored = await s3.upload(params).promise()
	    return stored;
	}
	catch (err) {
	    console.log(err)
	}
	// return s3.upload(params).promise();
};

// async function uploadFileToS3(buffer, name, type){
// 	return new Promise(function(resolve, reject) {
// 		s3.putObject({
// 	        Bucket: bucketName, // bucket name on which file to be uploaded
// 	        Key: `${name}`,  // file name on s3
// 	        ContentType: type.mime, // type of file
// 	        Body: buffer, // base-64 file stream
// 	        ACL: 'private'  // public read access
// 	    }, function (err, resp) {
// 	        if (err) {
// 	          	reject(err)
// 	        }
// 	        resolve(resp.Location)
// 	    })
// 	})
// }