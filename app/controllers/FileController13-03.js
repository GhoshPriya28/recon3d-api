require('dotenv').config();
const { BASE_URL,EVP_BASE_URL,EVP_USER_ID,EVP_CUSTOMER_ID,EVP_API_USERNAME,EVP_API_PASSWORD,EVP_API_SRC_TYPE} = process.env;
const db = require("../models");
const { UserModel: UserModel,FileTaskModel:FileTaskModel,TaskListModel:TaskListModel } = db;
const Op = db.Sequelize.Op;
const fs = require('fs');
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const multer  = require('multer');
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const path = require('url');
const paths = require('path');
const auth = require("../middlewares/jwt");
const { fsMerge } = require('split-chunk-merge');
const uploadFile = require("../middlewares/upload");
const FormData = require('form-data');
var form = new FormData();

var password = EVP_API_USERNAME+':'+EVP_API_PASSWORD;
var encodedPassword = Buffer.from(password).toString('base64');

const axios = require("axios").create({baseURL: EVP_BASE_URL, headers: {'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ=='}});
const S3 = require('aws-sdk/clients/s3');
const { devNull } = require('os');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});



exports.filesUpload = async (req, res) => {
  	try
  	{
  		uploadResult = await uploadFile(req, res);
		const uploadedFile = uploadResult.file;
		const { body, initiateId } = uploadResult;
		console.log('Initiate Id is',initiateId,uploadedFile);

	    if (req.files.length <= 0)
	    {
	    	return apiResponse.validationErrorWithData(res,"Please upload a file!");
	    }
	    else
	    {
	    	const initiateData = {
	    		initiate_id: initiateId,
	    		user_id:body.userId,
	    		file_size:body.fileSize,
	    		file_type:body.fileType,
	    		chunks:body.totalChunks,
	    		file_ext:body.fileExt,
	    		total_files:body.totalFilesToUpload,
				
	    	}
	    	console.log('Data to be initiated : ',initiateData);
	    	FileTaskModel.findOrCreate({where:{initiate_id: initiateId},defaults: initiateData}).then(initiateDetails => {
	    		const [ object, created ] = initiateDetails;
				console.log(object.initiate_id);
				if(body.fileType === 'video')
				{
					const fileExt = body.fileExt;
					const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;

					fs.readdir('./uploads/3d-requests/'+initiateId, (err, files) => {
						console.log('File Length',files.length);
						
						var excludeMerges=utility.excludeArray(files,'merges');
						if(body.totalChunks == files.length)
						{
							console.log('file Count is equal');
							const inputPath = paths.join("./uploads/3d-requests/"+initiateId+"/");
							const oPath = "./uploads/3d-requests/"+initiateId+"/merges/";
							if (!fs.existsSync(oPath)){
							    fs.mkdirSync(oPath, { recursive: true });
							}
							const outputPath = paths.join(oPath, mergeFileName)

							console.log('Files List From Folder : ',files);

							var inputData = [];
							var filesData = files.sort(utility.sortArray);
							console.log('sorted Data',filesData);
							filesData.forEach((element,index) => {
								inputData.push(element);
							});
							console.log('Files List : ',inputData)
							const inputPathList = inputData.map((item, index) => {
								console.log('item : ',item)
								return inputPath + item
							});
                            
							var excludeMerges=utility.excludeArray(files,'merges');
							
						    fsMerge(inputPathList, outputPath).then(response => {
										console.log('file',response)
										const fileContent = fs.readFileSync(outputPath)
										console.log(fileContent);
										excludeMerges.forEach(function(filename) {
											console.log(filename);
											fs.unlinkSync('./uploads/3d-requests/'+initiateId+'/'+filename);
											
										})
										fs.readdir('./uploads/3d-requests/'+initiateId+'/merges', (err, Mfiles) => {
											console.log(Mfiles.length);
											if(Mfiles.length==body.totalFilesToUpload)
											{
												var path='./uploads/3d-requests/'+initiateId+'/merges/';
												uploadMultipleFileToS3(Mfiles,initiateId,path).then(s3FileUrl => {
													//
													console.log(s3FileUrl.Location);
													FileTaskModel.update({s3_file_url:s3FileUrl},{where: {initiate_id: initiateId}}).then(taskDetails => {
														FileTaskModel.findOne({where: {initiate_id: initiateId}}).then(details => {
															let fileData = {initiateId:details.initiate_id,collectId:(details.ep_collect_id)?details.ep_collect_id:'',S3FileUrl:details.s3_file_url,file3dUrl:''};
															return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
														}).catch(err => {
															console.log(err)
															return apiResponse.notFoundResponse(res, err);
														})
													}).catch(err => {
														return apiResponse.notFoundResponse(res, err);
													});
												}).catch(err => {
													return apiResponse.notFoundResponse(res, err);
												})
											}
											else
											{
												let fileData = {initiateId:object.initiate_id.toString(),collectId:(object.ep_collect_id)?object.ep_collect_id:'',S3FileUrl:'',file3dUrl:''};
												return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
											}
									});								
										
								});
								
							
							
						}
						else
						{
							let fileData = {initiateId:object.initiate_id.toString(),collectId:(object.ep_collect_id)?object.ep_collect_id:'',S3FileUrl:'',file3dUrl:''};
							return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
						}
					});
				}
				else
				{
					fs.readdir('./uploads/3d-requests/'+initiateId, (err, files) => {
						console.log('File Length',files.length);
						if(body.totalFilesToUpload == files.length)
						{
							console.log('File Length is equal');
							uploadMultipleFileToS3(req.files,initiateId).then(s3FileUrl => {
								console.log('return array',s3FileUrl);
								FileTaskModel.update({s3_file_url:s3FileUrl},{where: {initiate_id: initiateId}}).then(imageTaskDetails => {
									FileTaskModel.findOne({where: {initiate_id: initiateId}}).then(details => {
										let fileData = {initiateId:details.initiate_id,collectId:(details.ep_collect_id)?details.ep_collect_id:'',S3FileUrl:details.s3_file_url,file3dUrl:''};
										return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
									}).catch(err => {
										console.log(err)
										return apiResponse.notFoundResponse(res, err);
									})
								}).catch(err => {
									console.log(err)
									return apiResponse.notFoundResponse(res, err);
								});
							}).catch(err => {
								console.log(err)
								return apiResponse.notFoundResponse(res, err);
							})
						}
						else
						{
							let fileData = {initiateId:object.initiate_id.toString(),collectId:(object.ep_collect_id)?object.ep_collect_id:'',S3FileUrl:'',file3dUrl:''};
							return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
						}
					});
				}
			}).catch(err => {
				console.log(err)
				return apiResponse.ErrorResponse(res, err);
			});
	    }
  	}
  	catch (err)
  	{
	    if(err.code == "LIMIT_FILE_SIZE")
	    {
	    	return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
	    }
	    else
	    {
    		return apiResponse.ErrorResponse(res, `Could not upload the file: ${err}`);	    	
	    }
  	}
};

// task status
exports.completeTask = [
	// auth,
    body("initiateId").isLength({ min: 1 }).trim().withMessage("Initate id must be specified."),
    body("userId").isLength({ min: 1 }).trim().withMessage("User id must be specified."),

    function (req, res)
    {
    	try
    	{
            const errors = validationResult(req);
            if (!errors.isEmpty())
            {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else
			{
				let initiateId = req.body.initiateId;
				let userId = req.body.userId;

				FileTaskModel.findOne({where: {initiate_id : initiateId}}).then(initiatorDetails => {
					if(!initiatorDetails)
					{
						return apiResponse.notFoundResponse(res, "Oops this initiate id not found within our system.");
					}
					else
					{
						var filePath = "./uploads/3d-requests/merges/"+initiateId+"-merge-file"+initiatorDetails.file_ext;
						var fileName = initiateId+"-merge-file"+initiatorDetails.file_ext;

						if(!initiatorDetails.ep_collect_id)
						{
							var requestBody = {
								"user_id": EVP_USER_ID,
								"src_type" : EVP_API_SRC_TYPE,
								"collect_date" : new Date().toISOString().replace('T', ' ').replace(/\..*$/, ''),
								"total_assets" : 1,
								"collect_name" : "First test dataset",
								"collect_notes" : "Sample Upload"
							}
							// console.log(requestBody);

							makeRequest('post','startCollection',requestBody).then(requestData => {
								console.log('Collect Id',requestData);
								FileTaskModel.update({ep_collect_id:requestData},{where: {initiate_id: initiateId}}).then(updatedData => {
									return apiResponse.successResponseWithData(res,"Task Created Successfuly.");
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								})
							}).catch(err => {
								return apiResponse.ErrorResponse(res, err);
							});
						}
						else
						{
							console.log('Collect Id Already Created.')
							uploadAssetToCollection(initiatorDetails.ep_collect_id,initiatorDetails.file_size,1,filePath,fileName)
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

exports.getScanList = [
	//auth,	
	function (req, res)
	{
		try{
            var userId = parseInt(req.query.userId,10);
	        var pageNo = parseInt(req.query.pageNo,10);  
	        var pagingLimit = parseInt(req.query.limit,10);
	        var pagingOffset = (pageNo - 1) * pagingLimit;

            if (!userId)
            {
				return apiResponse.notFoundResponse(res, "Provide a user id.");
			}
			else
			{
				var initiateData = [];
				var queryTask = {user_id:userId};
				FileTaskModel.findAndCountAll({where: queryTask,offset : pagingOffset,limit : pagingLimit}).then(fileDetails => {
					if(fileDetails.count > 0)
					{
						fileDetails.rows.forEach((element,index) => {
							let initiateDataa = {
								initiateId:element.initiate_id,
								userId:element.user_id,
								fileSize:element.file_size ? element.file_size : '',
								fileType:element.file_type ? element.file_type : '',
								fileExt:element.file_ext ? element.file_ext : '',
								totalChunks:element.chunks ? element.chunks : 0,
								leftChunks:element.left_chunk ? element.left_chunk : 0,
								s3FileUrl:element.s3_file_url ? element.s3_file_url : [],
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
				}).catch(err => {
					return apiResponse.ErrorResponse(res, err);
				});
			}
		}
		catch (err)
		{
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

const uploadFileToS3 = async (buffer, folderName, name, type) => {

	let bucketPath = folderName+'/'+name;
	console.log(bucketPath)
	const params = {
		ACL: 'private',
		StorageClass : 'STANDARD',
		Body: buffer,
		Bucket: bucketName,
		// ContentType: type.mime,
		//Key: `${name}.${type.ext}`
		Key: bucketPath
	};
	try {
    	const stored = await s3.upload(params).promise()
	    return stored;
	}
	catch (err) {
	    return err
	}
};

const uploadMultipleFileToS3 = async (files, folderName , pathU=null) =>
{
	var responseData = [];
	return await Promise.all(
		files.map(async (item) => {
			console.log(item);
			console.log(pathU);
			if(pathU)
			{
				var bucketPath = encodeURIComponent(folderName)+'/'+item;
                console.log(bucketPath);
				var fileContent = fs.readFileSync(pathU+item)
			}
			else
			{
				var bucketPath = encodeURIComponent(folderName)+'/'+item.originalname;
			    var fileContent = fs.readFileSync(item.path)
			}
			
			var params = {
				Bucket: bucketName,
				Key: bucketPath,
				Body: fileContent,
				ACL: 'private',
				StorageClass : 'STANDARD',
			};
			return await s3.upload(params).promise()
		})
	).then(data => {
		console.log('s3 data is',data)
		data.map(async (item) => {
			responseData.push(item.Location)
		})
		return responseData
	});
};

const makeRequest = async (method,apiEndpoint,curlBody = null,header = null) => {
	console.log(apiEndpoint , curlBody)
	return await axios.post('/'+apiEndpoint, curlBody).then(function (response) {
    	console.log(response.data.collect_id);
    	return response.data.collect_id;
  	}).catch(function (error) {
    	return error;
  	});
}

const uploadAssetToCollection = async(collectId,fileSize,fileNumber,filePath,fileName) => {
	const formData = new FormData();
	formData.append('user_id', EVP_USER_ID);
	formData.append('collect_id', collectId);
	formData.append('file_number', collectId);
	formData.append('file_size', collectId);
	formData.append('file', fs.createReadStream(filePath));
	console.log(formData);

	axios.post("/uploadAssetToCollection", formData, {headers: {"Content-Type": "multipart/form-data",}}).then((res) => {
        console.log(res);
    }).catch((err) => {
        console.log(err);
    });
}

const completeCollection = async(collectId) => {
	var requestBody = {
		"user_id": EVP_USER_ID,
		"collect_id" : collectId
	}
	//console.log(requestBody);
	makeRequest('post','endCollection',requestBody).then(requestData => {
		console.log('Response',requestData.data);
		return requestData.data;
	}).catch(err => {
		return apiResponse.ErrorResponse(res, err);
	});
}

const checkCollectionStatus = async(collectId) => {
	var requestBody = {
		"user_id": EVP_USER_ID,
		"collect_id" : collectId
	}
	//console.log(requestBody);
	makeRequest('post','checkCollectionStatus',requestBody).then(requestData => {
		console.log('Response',requestData.data);
		return requestData.data;
	}).catch(err => {
		return apiResponse.ErrorResponse(res, err);
	});
}

