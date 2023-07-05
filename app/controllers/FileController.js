require('dotenv').config();
const { BASE_URL, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
const db = require("../models");
const { UserModel: UserModel, FileTaskModel: FileTaskModel, TaskListModel: TaskListModel, SubFileTaskModel: SubFileTaskModel } = db;
const Op = db.Sequelize.Op;
// const fs = require('fs');
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const multer = require('multer');
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
// const path = require('url');
// const paths = require('path');
const auth = require("../middlewares/jwt");
const { fsMerge, streamMerge } = require('split-chunk-merge');
const uploadFile = require("../middlewares/upload");
const FormData = require('form-data');
var form = new FormData();
const util = require('util');
const join = require('path').join;
const s3Zip = require('s3-zip');
var ffmpeg = require('ffmpeg');
var moment = require('moment');
var configFile = require('../config/configFile');
const { constants } = require("../helpers/constants");
// const fs = require('fs/promises');
const path = require('path');

var password = EVP_API_USERNAME + ':' + EVP_API_PASSWORD;
var encodedPassword = Buffer.from(password).toString('base64');

const axios = require("axios").create({ baseURL: EVP_BASE_URL, headers: { 'Authorization': 'Basic cmVjb24zZDo3U1dZSVlJUHZXSzVCWExISkZwL05KSnV6UldIbU1BPQ==' } });
const S3 = require('aws-sdk/clients/s3');
const { devNull } = require('os');
const { async } = require('node-stream-zip');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
	region,
	accessKeyId,
	secretAccessKey,
});


const AWS = require('aws-sdk');
const fs = require('fs')

exports.s3download = (req, res) => {
	const fileKey = req.body.file;
	AWS.config.update(
		{
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: process.env.AWS_BUCKET_REGION
		}
	);
	var s3 = new AWS.S3();
	var options = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: fileKey,
	};
	const folderName = fileKey.slice(0,8)
	const fileName = fileKey.slice(9,53)
	const createFile = `${fileName}`
	const createFolder = `${folderName}`;
	if (!fs.existsSync(createFolder)) {
		fs.mkdirSync(createFolder);
	  }
	var rs = s3.getObject(options).createReadStream();
	console.log("rs", rs);
	const ws = fs.createWriteStream(path.join(`${createFolder}`, `${createFile}`));
	rs.pipe(ws);
};





exports.filesUploadOld = async (req, res) => {
	try {
		uploadResult = await uploadFile(req, res);
		const uploadedFile = uploadResult.file;
		const { body, initiateId } = uploadResult;
		console.log('Initiate Id is', initiateId, uploadedFile);

		if (req.files.length <= 0) {
			return apiResponse.validationErrorWithData(res, "Please upload a file!");
		}
		else {
			const initiateData = {
				initiate_id: initiateId,
				user_id: body.userId,
				file_size: body.fileSize,
				file_type: body.fileType,
				chunks: body.totalChunks,
				file_ext: body.fileExt,
				epars: body.epars ? body.epars : '',
				total_files: body.totalFilesToUpload,

			}
			console.log('Data to be initiated : ', initiateData);
			FileTaskModel.findOrCreate({ where: { initiate_id: initiateId }, defaults: initiateData }).then(async initiateDetails => {
				const [object, created] = initiateDetails;
				console.log(object.initiate_id);
				if (body.fileType === 'video' && body.fileExt != '' && body.fileExt != 'dmp' && body.fileExt != 'plist') {
					const fileExt = body.fileExt;
					//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
					const mergeFileName = req.body.fileName + '.' + fileExt;
					await fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
						console.log('File Length', files.length);

						var excludeMerges = utility.excludeArray(files, 'merges');
						if (body.totalChunks == files.length) {
							console.log('file Count is equal');
							const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
							const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
							if (!fs.existsSync(oPath)) {
								fs.mkdirSync(oPath, { recursive: true });
							}
							const outputPath = paths.join(oPath, mergeFileName)

							console.log('Files List From Folder : ', files);

							var inputData = [];
							var filesData = files.sort(utility.sortArray);
							console.log('sorted Data', filesData);
							filesData.forEach((element, index) => {
								inputData.push(element);
							});
							console.log('Files List : ', inputData)
							const inputPathList = inputData.map((item, index) => {
								console.log('item : ', item)
								return inputPath + item
							});

							var excludeMerges = utility.excludeArray(files, 'merges');

							streamMerge(inputPathList, outputPath).then(async response => {
								const subTask =
								{
									initiate_id: initiateId,
									merge_file: mergeFileName,
									merge_file_path: response,
									size: body.fileSize,
									file_index: body.fileIndex,
								}

								//Save Sub
								SubFileTaskModel.create(subTask).then(async collectD => {
									console.log('Sub task save');



									console.log('file', response)
									const fileContent = fs.readFileSync(outputPath)
									console.log(fileContent);

									await fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
										console.log(Mfiles.length);
										if (body.fileExt == 'eparls' && Mfiles.length == body.totalFilesToUpload) {
											var path = './uploads/3d-requests/' + initiateId + '/merges/';
											console.log('eparseeeee');
											uploadMultipleFileToS3(Mfiles, initiateId, path).then(async s3FileUrl => {
												//
												console.log('S33   file upload', s3FileUrl);

												let urlsS3 = JSON.stringify(s3FileUrl);

												await FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId } }).then(async taskDetails => {
													FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async details => {
														let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };


														//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
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
											//return apiResponse.successResponseWithData(res,"Task Created Successfuly.");
										}
										else if (Mfiles.length == 4) {
											excludeMerges.forEach(function (filename) {
												console.log(filename);
												fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);

											})
											var path = './uploads/3d-requests/' + initiateId + '/merges/';
											uploadMultipleFileToS3(Mfiles, initiateId, path).then(async s3FileUrl => {
												//


												let urlsS3 = JSON.stringify(s3FileUrl);

												await FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId } }).then(async taskDetails => {
													FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async details => {
														let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
														if (details.internal_status == '5') {
															let apiEndpoint = 'completeTask';
															let curlBody = {
																initiateId: details.initiate_id,
																userId: details.user_id,
																dataSetType: '1'
															}
															return await axios.post('/' + apiEndpoint, curlBody).then(function (response) {
																//console.log(response.data.collect_id);
																//return response.data.collect_id;
															}).catch(function (error) {
																return error;
															});

														}

														//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
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
											return apiResponse.successResponseWithData(res, "Task Created Successfuly.");
										}
										else {
											let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
											return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
										}
									});
								});

							});
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.");


						}
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
						return apiResponse.successResponseWithData(res, "Task Created Successfuly.");
					});
				}
				else if (body.fileType == 'video') {

					const fileExt = body.fileExt;
					//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
					const mergeFileName = req.body.fileName + '.' + fileExt;
					FileTaskModel.update({ internal_status: '0', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskU => {
					});
					fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
						console.log('File Length', files.length);
						//Make Folder For Video..
						let makeFolder = 'TotalChunks/' + initiateId + "-" + req.body.fileIndex;
						let folderN = "./uploads/3d-requests/" + initiateId + '/' + makeFolder;
						if (!fs.existsSync(folderN)) {
							fs.mkdirSync(folderN, { recursive: true });
						}
						fs.copyFile('./uploads/3d-requests/' + initiateId + '/' + initiateId + "-index-" + req.body.fileIndex + '-chunk-' + req.body.chunkIndex, './uploads/3d-requests/' + initiateId + '/' + makeFolder + '/' + initiateId + "-" + req.body.fileIndex + '-chunk-' + req.body.chunkIndex, (err) => {
							if (err) throw err;
							console.log('Copy file');
						});
						var excludeMerges = utility.excludeArray(files, 'merges', 'TotalChunks');
						if (body.totalChunks == files.length) {
							console.log('file Count is equal');
							const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
							const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
							if (!fs.existsSync(oPath)) {
								fs.mkdirSync(oPath, { recursive: true });
							}
							const outputPath = paths.join(oPath, mergeFileName)
							console.log('Files List From Folder : ', files);
							let inputData = [];
							let filesData = files.sort(utility.sortArray);
							console.log('sorted Data', filesData);
							filesData.forEach((element, index) => {
								inputData.push(element);
							});
							console.log('Files List : ', inputData)
							const inputPathList = inputData.map((item, index) => {
								console.log('item : ', item)
								return inputPath + item
							});
							let excludeMerges = utility.excludeArray(files, 'merges');
							streamMerge(inputPathList, outputPath).then(response => {
								const subTask =
								{
									initiate_id: initiateId,
									merge_file: mergeFileName,
									merge_file_path: response,
									size: body.fileSize,
									file_index: body.fileIndex,
								}
								//Save Sub
								SubFileTaskModel.create(subTask).then(collectD => {
									console.log('Sub task save');
								})
								console.log('file', response)
								const fileContent = fs.readFileSync(outputPath)
								console.log(fileContent);
								excludeMerges.forEach(function (filename) {
									console.log(filename);
									fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);
								})
								fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
									console.log(Mfiles.length);
									if (Mfiles.length == body.totalFilesToUpload) {
										let path = './uploads/3d-requests/' + initiateId + '/merges/';
										uploadMultipleFileToS3(Mfiles, initiateId, path).then(s3FileUrl => {
											let urlsS3 = JSON.stringify(s3FileUrl);
											SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {
												FileTaskModel.update({ s3_file_url: urlsS3, internal_status: '1', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskDetails => {
													FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
														let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
														//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
													}).catch(err => {
														console.log(err)
														return apiResponse.notFoundResponse(res, err);
													})
												}).catch(err => {
													return apiResponse.notFoundResponse(res, err);
												});
											});
										}).catch(err => {
											return apiResponse.notFoundResponse(res, err);
										});

										let fileDataa = { initiateId: initiateId ? initiateId : '', S3FileUrl: '1', file3dUrl: '' };
										return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileDataa);

									}
									else {
										let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
										return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
									}
								});
							});


						}
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
					});

				}
				else if (body.fileType == 'images') {

					const fileExt = body.fileExt;
					//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
					const mergeFileName = req.body.fileName + '.' + fileExt;
					fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
						console.log('File Length', files.length);
						var excludeMerges = utility.excludeArray(files, 'merges');
						if (body.totalChunks == files.length) {
							console.log('file Count is equal');
							const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
							const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
							if (!fs.existsSync(oPath)) {
								fs.mkdirSync(oPath, { recursive: true });
							}
							const outputPath = paths.join(oPath, mergeFileName)
							console.log('Files List From Folder : ', files);
							var inputData = [];
							var filesData = files.sort(utility.sortArray);
							console.log('sorted Data', filesData);
							filesData.forEach((element, index) => {
								inputData.push(element);
							});
							console.log('Files List : ', inputData)
							const inputPathList = inputData.map((item, index) => {
								console.log('item : ', item)
								return inputPath + item
							});
							var excludeMerges = utility.excludeArray(files, 'merges');
							fsMerge(inputPathList, outputPath).then(response => {
								const subTask =
								{
									initiate_id: initiateId,
									merge_file: mergeFileName,
									merge_file_path: response,
									size: body.fileSize,
									file_index: body.fileIndex,
								}
								//Save Sub
								SubFileTaskModel.create(subTask).then(collectD => {
									console.log('Sub task save');
								})
								console.log('file', response)
								const fileContent = fs.readFileSync(outputPath)
								console.log(fileContent);
								excludeMerges.forEach(function (filename) {
									console.log(filename);
									fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);
								})
								fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
									console.log(Mfiles.length);
									if (Mfiles.length == body.totalFilesToUpload) {
										var path = './uploads/3d-requests/' + initiateId + '/merges/';
										uploadMultipleFileToS3(Mfiles, initiateId, path).then(s3FileUrl => {
											let urlsS3 = JSON.stringify(s3FileUrl);
											FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId } }).then(taskDetails => {
												FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
													let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };

													return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
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
									else {
										let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
										return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
									}
								});
							});
						}
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
					});

				}
				else {
					fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
						console.log('File Length', files.length);
						if (body.totalFilesToUpload == files.length) {
							console.log('File Length is equal');
							uploadMultipleFileToS3(req.files, initiateId).then(s3FileUrl => {
								console.log('return array', s3FileUrl);
								let urlsS3 = JSON.stringify(s3FileUrl);

								FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId } }).then(imageTaskDetails => {
									FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
										let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
										return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
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
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
					});
				}
			}).catch(err => {
				console.log(err)
				return apiResponse.ErrorResponse(res, err);
			});
		}
	}
	catch (err) {
		if (err.code == "LIMIT_FILE_SIZE") {
			return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
		}
		else {
			return apiResponse.ErrorResponse(res, `Could not upload the file: ${err}`);
		}
	}
};



exports.filesUpload_04_08 = async (req, res) => {
	try {
		uploadResult = await uploadFile(req, res);
		const uploadedFile = uploadResult.file;
		const { body, initiateId } = uploadResult;
		console.log('Initiate Id is', initiateId, uploadedFile);
		const folderExist = "./uploads/3d-requests/" + initiateId;
		if (req.files.length <= 0) {
			return apiResponse.validationErrorWithData(res, "Please upload a file!");
		}
		else if (!fs.existsSync(folderExist)) {
			console.log('folder ', folderExist);
			return apiResponse.ErrorResponse(res, 'Initiate folder Not Exist');
		}
		else {
			const initiateData = {
				initiate_id: initiateId,
				user_id: body.userId,
				file_size: body.fileSize,
				file_type: body.fileType,
				chunks: body.totalChunks,
				file_ext: body.fileExt,
				total_files: body.totalFilesToUpload,

			}
			console.log('Data to be initiated : ', initiateData);
			FileTaskModel.findOrCreate({ where: { initiate_id: initiateId }, defaults: initiateData }).then(async initiateDetails => {
				const [object, created] = initiateDetails;
				console.log(object.initiate_id);
				if (body.fileType === 'video' && body.fileExt != '' && body.fileExt != 'dmp') {
					const fileExt = body.fileExt;
					//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
					const mergeFileName = req.body.fileName + '.' + fileExt;
					fs.readdir('./uploads/3d-requests/' + initiateId, (readDirerr, files) => {
						if (readDirerr) {
							console.log(readDirerr);
							return apiResponse.ErrorResponse(res, readDirerr);

						}
						//console.log('File Length',files.length);

						var excludeMerges = utility.excludeArray(files, 'merges');
						if (body.totalChunks == files.length) {
							console.log('file Count is equal');
							const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
							const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
							if (!fs.existsSync(oPath)) {
								fs.mkdirSync(oPath, { recursive: true });
							}
							const outputPath = paths.join(oPath, mergeFileName)

							console.log('Files List From Folder : ', files);

							var inputData = [];
							var filesData = files.sort(utility.sortArray);
							console.log('sorted Data', filesData);
							filesData.forEach((element, index) => {
								inputData.push(element);
							});
							console.log('Files List : ', inputData)
							const inputPathList = inputData.map((item, index) => {
								console.log('item : ', item)
								return inputPath + item
							});

							var excludeMerges = utility.excludeArray(files, 'merges');


							streamMerge(inputPathList, outputPath).then(async response => {
								const subTask =
								{
									initiate_id: initiateId,
									merge_file: mergeFileName,
									merge_file_path: response,
									size: body.fileSize,
									file_index: body.fileIndex,
								}

								//Save Sub
								SubFileTaskModel.create(subTask).then(async collectD => {
									console.log('Sub task save');
									console.log('file', response)
									const fileContent = fs.readFileSync(outputPath)
									console.log(fileContent);
									if (body.fileExt != 'eparls') {
										excludeMerges.forEach(function (filename) {
											console.log(filename);
											fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);

										})
									}

									await fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
										console.log('Folder File Length', Mfiles.length);

										if (Mfiles.length == 4) {
											var path = './uploads/3d-requests/' + initiateId + '/merges/';
											uploadMultipleFileToS3(Mfiles, initiateId, path).then(async s3FileUrl => {
												//


												let urlsS3 = JSON.stringify(s3FileUrl);

												await FileTaskModel.update({ s3_file_url: urlsS3, ep_collect_id: '' }, { where: { initiate_id: initiateId } }).then(async taskDetails => {
													FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async details => {
														let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
														if (details.internal_status == '5') {
															let apiEndpoint = 'completeTask';
															let curlBody = {
																initiateId: details.initiate_id,
																userId: details.user_id,
																dataSetType: '1'
															}
															return await axios.post('/' + apiEndpoint, curlBody).then(function (response) {
																//console.log(response.data.collect_id);
																//return response.data.collect_id;
															}).catch(function (error) {
																return error;
															});

														}

														return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
													}).catch(err => {
														console.log(err)
														return apiResponse.ErrorResponse(res, err);
													})
												}).catch(err => {
													return apiResponse.ErrorResponse(res, err);
												});
											}).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											})
										}
										else if (body.fileExt == 'eparls' && Mfiles.length == body.totalFilesToUpload) {
											var path = './uploads/3d-requests/' + initiateId + '/merges/';
											console.log('Eparls File : eparseeeee');
											uploadMultipleFileToS3(Mfiles, initiateId, path).then(async s3FileUrl => {
												//
												console.log('S33   file upload', s3FileUrl);

												let urlsS3 = JSON.stringify(s3FileUrl);

												await FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId } }).then(async taskDetails => {
													await FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async details => {
														let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
														/* Extract Start */
														const exec = util.promisify(require('child_process').exec);
														async function lsWithGrep() {
															try {
																const eParsePath = "./uploads/eparls/output/" + initiateId;
																if (!fs.existsSync(eParsePath)) {
																	fs.mkdirSync(eParsePath, { recursive: true });
																}
																const { stdout, stderr } = await exec("./cmd/eparss ./uploads/3d-requests/" + initiateId + "/merges/" + mergeFileName + " -x ./uploads/eparls/output/" + initiateId + "");
																console.log('stdout:', stdout)
																console.log('stderr:', stderr)
															}
															catch (err) {
																console.error(err)
															}
														}
														lsWithGrep();

														/* Extract End */

														//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
													}).catch(err => {
														console.log(err)
														return apiResponse.ErrorResponse(res, err);
													})
												}).catch(err => {
													return apiResponse.ErrorResponse(res, err);
												});
											}).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											})
											//return apiResponse.successResponseWithData(res,"Task Created Successfuly.");
										}
										else {
											let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
											//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
										}
									});
								});

							});

							return apiResponse.successResponseWithData(res, "Task Created Successfuly.");

						}
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
					})
				}
				else if (body.fileType == 'images') {

					const fileExt = body.fileExt;
					//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
					const mergeFileName = req.body.fileName + '.' + fileExt;
					FileTaskModel.update({ internal_status: '0', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskU => {
					});
					fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
						console.log('File Length', files.length);
						let excludeMerges = utility.excludeArray(files, 'merges');
						if (body.totalChunks == files.length) {
							console.log('file Count is equal');
							const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
							const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
							if (!fs.existsSync(oPath)) {
								fs.mkdirSync(oPath, { recursive: true });
							}
							const outputPath = paths.join(oPath, mergeFileName)
							console.log('Files List From Folder : ', files);
							let inputData = [];
							let filesData = files.sort(utility.sortArray);
							console.log('sorted Data', filesData);
							filesData.forEach((element, index) => {
								inputData.push(element);
							});
							console.log('Files List : ', inputData)
							const inputPathList = inputData.map((item, index) => {
								console.log('item : ', item)
								return inputPath + item
							});
							let excludeMerges = utility.excludeArray(files, 'merges');
							streamMerge(inputPathList, outputPath).then(response => {
								const subTask =
								{
									initiate_id: initiateId,
									merge_file: mergeFileName,
									merge_file_path: response,
									size: body.fileSize,
									file_index: body.fileIndex,
								}
								//Save Sub
								SubFileTaskModel.create(subTask).then(collectD => {
									console.log('Sub task save');
								})
								console.log('file', response)
								const fileContent = fs.readFileSync(outputPath)
								console.log(fileContent);
								excludeMerges.forEach(function (filename) {
									console.log(filename);
									fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);
								})
								fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
									console.log(Mfiles.length);
									if (Mfiles.length == body.totalFilesToUpload) {
										let path = './uploads/3d-requests/' + initiateId + '/merges/';
										uploadMultipleFileToS3(Mfiles, initiateId, path).then(s3FileUrl => {
											let urlsS3 = JSON.stringify(s3FileUrl);
											SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {
												FileTaskModel.update({ s3_file_url: urlsS3, internal_status: '1', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskDetails => {
													FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
														let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
														return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
													}).catch(err => {
														console.log(err)
														return apiResponse.notFoundResponse(res, err);
													})
												}).catch(err => {
													return apiResponse.notFoundResponse(res, err);
												});
											});
										}).catch(err => {
											return apiResponse.notFoundResponse(res, err);
										})
									}
									else {
										let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
										return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
									}
								});
							});
						}
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
					});

				}
				else {
					fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
						console.log('File Length', files.length);
						if (body.totalFilesToUpload == files.length) {
							console.log('File Length is equal');
							uploadMultipleFileToS3(req.files, initiateId).then(s3FileUrl => {
								console.log('return array', s3FileUrl);
								let urlsS3 = JSON.stringify(s3FileUrl);

								FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId } }).then(imageTaskDetails => {
									FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
										let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
										//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
									}).catch(err => {
										console.log(err)
										return apiResponse.ErrorResponse(res, err);
									})
								}).catch(err => {
									console.log(err)
									return apiResponse.ErrorResponse(res, err);
								});
							}).catch(err => {
								console.log(err)
								return apiResponse.ErrorResponse(res, err);
							})
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.");
						}
						else {
							let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
							return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
						}
					});
				}
			}).catch(err => {
				console.log(err)
				return apiResponse.ErrorResponse(res, err);
			});
		}
	}
	catch (err) {
		// if(err.code == "LIMIT_FILE_SIZE")
		// {
		// 	return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
		// }
		// else
		// {
		console.log(err);
		return apiResponse.ErrorResponse(res, `Could not upload the file: `);
		// }
	}
};

exports.filesUpload = async (req, res) => {
	try {
		uploadResult = await uploadFile(req, res);
		const uploadedFile = uploadResult.file;
		const { body, initiateId } = uploadResult;
		console.log('Initiate Id is', initiateId, uploadedFile);
		const folderExist = "./uploads/3d-requests/" + initiateId;
		if (req.files.length <= 0) {
			return apiResponse.validationErrorWithData(res, "Please upload a file!");
		}
		else if (!fs.existsSync(folderExist)) {
			console.log('folder ', folderExist);
			return apiResponse.ErrorResponse(res, 'Initiate folder Not Exist');
		}
		else {
			const initiateData = {
				initiate_id: initiateId,
				user_id: body.userId,
				file_size: body.fileSize,
				file_type: body.fileType,
				chunks: body.totalChunks,
				file_ext: body.fileExt,
				total_files: body.totalFilesToUpload,
				collect_name: body.collect_name ? body.collect_name : '',
				collect_notes: body.collect_notes ? body.collect_notes : ''

			}
			console.log('Data to be initiated : ', initiateData);
			FileTaskModel.findOrCreate({ where: { initiate_id: initiateId }, defaults: initiateData }).then(async initiateDetails => {
				FileTaskModel.findOne({ where: { initiate_id: initiateId, user_id: body.userId } }).then(detailsTask => {
					if (detailsTask) {
						const [object, created] = initiateDetails;
						console.log(object.initiate_id);
						console.log('Out Side');
						if (body.fileExt === 'eparls' || body.fileExt === 'epars') {
							const fileExt = body.fileExt;
							//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
							const mergeFileName = req.body.fileName + '.' + fileExt;
							fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
								console.log('save file', files);
								//Make dir for multi files video
								//let cunksFolder=

								console.log('File Length', files.length);

								var excludeMerges = utility.excludeArray(files, 'merges');
								console.log('Exclude', excludeMerges);
								FileTaskModel.update({ internal_status: '0', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskU => {
								});
								if (body.totalChunks == files.length) {
									console.log('file Count is equal');
									const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
									const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
									if (!fs.existsSync(oPath)) {
										fs.mkdirSync(oPath, { recursive: true });
									}
									const outputPath = paths.join(oPath, mergeFileName)

									console.log('Files List From Folder : ', files);

									var inputData = [];
									var filesData = files.sort(utility.sortArray);
									console.log('sorted Data', filesData);
									filesData.forEach((element, index) => {
										inputData.push(element);
									});
									console.log('Files List : ', inputData)
									const inputPathList = inputData.map((item, index) => {
										console.log('item : ', item)
										return inputPath + item
									});

									var excludeMerges = utility.excludeArray(files, 'merges');

									streamMerge(inputPathList, outputPath).then(async response => {
										const subTask =
										{
											initiate_id: initiateId,
											merge_file: mergeFileName,
											merge_file_path: response,
											size: body.fileSize,
											file_index: body.fileIndex,
										}

										//Save Sub
										SubFileTaskModel.create(subTask).then(async collectD => {
											console.log('Sub task save');
											console.log('file', response)
											// const fileContent = fs.createReadStream(outputPath)
											// console.log('File Read Content',fileContent);
											/*excludeMerges.forEach(function(filename) {
												 console.log(filename);
											   fs.unlinkSync('./uploads/3d-requests/'+initiateId+'/'+filename);
											})*/
											await fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
												console.log('Merge Files Total', Mfiles.length);

												if (Mfiles.length == body.totalFilesToUpload) {
													var path = './uploads/3d-requests/' + initiateId + '/merges/';
													uploadMultipleFileToS3(Mfiles, initiateId, path).then(async s3FileUrl => {
														//
														let urlsS3 = '';
														if (s3FileUrl.length > 0) {
															urlsS3 = JSON.stringify(s3FileUrl);
														}


														SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {
															FileTaskModel.update({ s3_file_url: urlsS3, ep_collect_id: '', file_size: totalSum, internal_status: '4', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskDetails => {
																FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
																	let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };

																	if (body.fileExt == 'eparls') {
																		/* Extract Start */
																		const exec = util.promisify(require('child_process').exec);
																		async function lsWithGrep() {
																			try {
																				const eParsePath = "./uploads/eparls/output/" + initiateId;
																				if (!fs.existsSync(eParsePath)) {
																					fs.mkdirSync(eParsePath, { recursive: true });
																				}
																				const { stdout, stderr } = await exec("./cmd/eparss ./uploads/3d-requests/" + initiateId + "/merges/" + mergeFileName + " -x ./uploads/eparls/output/" + initiateId + "");
																				console.log('stdout:', stdout)
																				console.log('stderr:', stderr)
																			}
																			catch (err) {
																				console.error(err)
																			}
																		}
																		lsWithGrep();

																		/* Extract End */
																	}
																	else if (body.fileExt == 'epars') {
																		/* Extract Start */
																		const exec = util.promisify(require('child_process').exec);
																		async function lsWithGrep() {
																			try {
																				const eParsePath = "./uploads/epars/output/" + initiateId;
																				if (!fs.existsSync(eParsePath)) {
																					fs.mkdirSync(eParsePath, { recursive: true });
																				}
																				const { stdout, stderr } = await exec("./cmd/eparss ./uploads/3d-requests/" + initiateId + "/merges/" + mergeFileName + " -x ./uploads/epars/output/" + initiateId + "");
																				console.log('stdout:', stdout)
																				console.log('stderr:', stderr)
																			}
																			catch (err) {
																				console.error(err)
																			}
																		}
																		lsWithGrep();

																		/* Extract End */
																	}

																	//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
																}).catch(err => {
																	console.log(err)
																	return apiResponse.notFoundResponse(res, err);
																})
															}).catch(err => {
																return apiResponse.notFoundResponse(res, err);
															});
														});


													}).catch(err => {
														return apiResponse.notFoundResponse(res, err);
													})

													//let fileData = {initiateId:initiateId,S3FileUrl:'1',file3dUrl:''};
													//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
												}

											});
										});

									});
									let fileData = { initiateId: initiateId ? initiateId : '', S3FileUrl: '1', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);


								}
								else {
									let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
								}
							});
						}
						else if (body.fileType == 'video') {

							const fileExt = body.fileExt;
							//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
							const mergeFileName = req.body.fileName + '_' + req.body.fileIndex + '.' + fileExt;
							FileTaskModel.update({ internal_status: '0', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskU => {
							});
							fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
								console.log('File Length', files.length);
								//Make Folder For Video..
								let makeFolder = 'TotalChunks/' + initiateId + "-" + req.body.fileIndex;
								let folderN = "./uploads/3d-requests/" + initiateId + '/' + makeFolder;
								if (!fs.existsSync(folderN)) {
									fs.mkdirSync(folderN, { recursive: true });
								}
								fs.copyFile('./uploads/3d-requests/' + initiateId + '/' + initiateId + "-index-" + req.body.fileIndex + '-chunk-' + req.body.chunkIndex, './uploads/3d-requests/' + initiateId + '/' + makeFolder + '/' + initiateId + "-" + req.body.fileIndex + '-chunk-' + req.body.chunkIndex, (err) => {
									if (err) throw err;
									console.log('Copy file');
								});
								var excludeMerges = utility.excludeArray(files, 'merges', 'TotalChunks');
								if (body.totalChunks == files.length) {
									console.log('file Count is equal');
									const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
									const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
									if (!fs.existsSync(oPath)) {
										fs.mkdirSync(oPath, { recursive: true });
									}
									const outputPath = paths.join(oPath, mergeFileName)
									console.log('Files List From Folder : ', files);
									let inputData = [];
									let filesData = files.sort(utility.sortArray);
									console.log('sorted Data', filesData);
									filesData.forEach((element, index) => {
										inputData.push(element);
									});
									console.log('Files List : ', inputData)
									const inputPathList = inputData.map((item, index) => {
										console.log('item : ', item)
										return inputPath + item
									});
									let excludeMerges = utility.excludeArray(files, 'merges', 'TotalChunks');
									streamMerge(inputPathList, outputPath).then(response => {
										if (body.fileIndex == 0) {
											const thumbOutputPath = "./uploads/thumbnails/";
											console.log(thumbOutputPath);
											var fileThumbName = '';

											getThumbnailFromVideo(response, thumbOutputPath, initiateId).then(thumnailName => {
												fileThumbName = thumnailName
												console.log('File Thumbnail name is ', fileThumbName)
											});
										}

										const subTask =
										{
											initiate_id: initiateId,
											merge_file: mergeFileName,
											merge_file_path: response,
											size: body.fileSize,
											file_index: body.fileIndex,
										}
										//Save Sub
										SubFileTaskModel.create(subTask).then(collectD => {
											console.log('Sub task save');
										})
										console.log('file', response)
										const fileContent = fs.readFileSync(outputPath)
										console.log(fileContent);
										excludeMerges.forEach(function (filename) {
											console.log(filename);
											fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);
										})
										fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
											console.log(Mfiles.length);
											if (Mfiles.length == body.totalFilesToUpload) {
												let path = './uploads/3d-requests/' + initiateId + '/merges/';
												uploadMultipleFileToS3(Mfiles, initiateId, path).then(s3FileUrl => {
													let urlsS3 = JSON.stringify(s3FileUrl);
													SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {
														FileTaskModel.update({ s3_file_url: urlsS3, internal_status: '4', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskDetails => {
															FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
																let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
																//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
															}).catch(err => {
																console.log(err)
																return apiResponse.notFoundResponse(res, err);
															})
														}).catch(err => {
															return apiResponse.notFoundResponse(res, err);
														});
													});
												}).catch(err => {
													return apiResponse.notFoundResponse(res, err);
												});

												let fileDataa = { initiateId: initiateId ? initiateId : '', S3FileUrl: '1', file3dUrl: '' };
												return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileDataa);

											}
											else {
												let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
												return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
											}
										});
									});


								}
								else {
									let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
								}
							});

						}
						else if (body.fileType === 'video1234') {
							const fileExt = body.fileExt;
							//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
							const mergeFileName = req.body.fileName + '.' + fileExt;
							fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
								console.log('File Length', files.length);

								var excludeMerges = utility.excludeArray(files, 'merges');
								FileTaskModel.update({ internal_status: '0', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskU => {
								});
								if (body.totalChunks == files.length) {
									console.log('file Count is equal');
									const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
									const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
									if (!fs.existsSync(oPath)) {
										fs.mkdirSync(oPath, { recursive: true });
									}
									const outputPath = paths.join(oPath, mergeFileName)

									console.log('Files List From Folder : ', files);

									var inputData = [];
									var filesData = files.sort(utility.sortArray);
									console.log('sorted Data', filesData);
									filesData.forEach((element, index) => {
										inputData.push(element);
									});
									console.log('Files List : ', inputData)
									const inputPathList = inputData.map((item, index) => {
										console.log('item : ', item)
										return inputPath + item
									});

									var excludeMerges = utility.excludeArray(files, 'merges');

									streamMerge(inputPathList, outputPath).then(async response => {

										/* const thumbOutputPath = "./uploads/thumbnails/";
										 console.log(thumbOutputPath);
															 var fileThumbName='';
															 getThumbnailFromVideo(response,thumbOutputPath,initiateId).then(thumnailName => {
																  fileThumbName = thumnailName
																 console.log('File Thumbnail name is ',fileThumbName)
															 });*/



										const subTask =
										{
											initiate_id: initiateId,
											merge_file: mergeFileName,
											merge_file_path: response,
											size: body.fileSize,
											file_index: body.fileIndex,
										}

										//Save Sub
										SubFileTaskModel.create(subTask).then(async collectD => {
											console.log('Sub task save');



											console.log('file', response)
											// const fileContent = fs.createReadStream(outputPath)
											// console.log('File Read Content',fileContent);
											// excludeMerges.forEach(function(filename) {
											// 	console.log(filename);
											// 	fs.unlinkSync('./uploads/3d-requests/'+initiateId+'/'+filename);

											// })
											await fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
												console.log('Merge Files Total', Mfiles.length);

												if (Mfiles.length == body.totalFilesToUpload) {
													var path = './uploads/3d-requests/' + initiateId + '/merges/';
													uploadMultipleFileToS3(Mfiles, initiateId, path).then(async s3FileUrl => {
														//
														let urlsS3 = '';
														if (s3FileUrl.length > 0) {
															urlsS3 = JSON.stringify(s3FileUrl);
														}


														SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {
															FileTaskModel.update({ s3_file_url: urlsS3, ep_collect_id: '', file_size: totalSum, internal_status: '1', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskDetails => {
																FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
																	let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };

																	if (body.fileExt == 'eparls') {
																		/* Extract Start */
																		const exec = util.promisify(require('child_process').exec);
																		async function lsWithGrep() {
																			try {
																				const eParsePath = "./uploads/eparls/output/" + initiateId;
																				if (!fs.existsSync(eParsePath)) {
																					fs.mkdirSync(eParsePath, { recursive: true });
																				}
																				const { stdout, stderr } = await exec("./cmd/eparss ./uploads/3d-requests/" + initiateId + "/merges/" + mergeFileName + " -x ./uploads/eparls/output/" + initiateId + "");
																				console.log('stdout:', stdout)
																				console.log('stderr:', stderr)
																			}
																			catch (err) {
																				console.error(err)
																			}
																		}
																		lsWithGrep();

																		/* Extract End */
																	}
																	else if (body.fileExt == 'epars') {
																		/* Extract Start */
																		const exec = util.promisify(require('child_process').exec);
																		async function lsWithGrep() {
																			try {
																				const eParsePath = "./uploads/epars/output/" + initiateId;
																				if (!fs.existsSync(eParsePath)) {
																					fs.mkdirSync(eParsePath, { recursive: true });
																				}
																				const { stdout, stderr } = await exec("./cmd/eparss ./uploads/3d-requests/" + initiateId + "/merges/" + mergeFileName + " -x ./uploads/epars/output/" + initiateId + "");
																				console.log('stdout:', stdout)
																				console.log('stderr:', stderr)
																			}
																			catch (err) {
																				console.error(err)
																			}
																		}
																		lsWithGrep();

																		/* Extract End */
																	}



																	//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
																}).catch(err => {
																	console.log(err)
																	return apiResponse.notFoundResponse(res, err);
																})
															}).catch(err => {
																return apiResponse.notFoundResponse(res, err);
															});
														});


													}).catch(err => {
														return apiResponse.notFoundResponse(res, err);
													})

													//let fileData = {initiateId:initiateId,S3FileUrl:'1',file3dUrl:''};
													//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
												}
												else {
													let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
													return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
												}
											});
										});

									});
									let fileData = { initiateId: initiateId ? initiateId : '', S3FileUrl: '1', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);


								}
								else {
									let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
								}
							});
						}
						else if (body.fileType == 'images') {

							const fileExt = body.fileExt;
							//const mergeFileName = initiateId+'-'+body.fileIndex+"-merge-file."+fileExt;
							const mergeFileName = req.body.fileName + '.' + fileExt;
							FileTaskModel.update({ internal_status: '4', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskU => {
							});
							fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
								console.log('File Length', files.length);
								let excludeMerges = utility.excludeArray(files, 'merges');
								if (body.totalChunks == files.length) {
									console.log('file Count is equal');
									const inputPath = paths.join("./uploads/3d-requests/" + initiateId + "/");
									const oPath = "./uploads/3d-requests/" + initiateId + "/merges/";
									if (!fs.existsSync(oPath)) {
										fs.mkdirSync(oPath, { recursive: true });
									}
									const outputPath = paths.join(oPath, mergeFileName)
									console.log('Files List From Folder : ', files);
									let inputData = [];
									let filesData = files.sort(utility.sortArray);
									console.log('sorted Data', filesData);
									filesData.forEach((element, index) => {
										inputData.push(element);
									});
									console.log('Files List : ', inputData)
									const inputPathList = inputData.map((item, index) => {
										console.log('item : ', item)
										return inputPath + item
									});
									let excludeMerges = utility.excludeArray(files, 'merges');
									streamMerge(inputPathList, outputPath).then(response => {
										const subTask =
										{
											initiate_id: initiateId,
											merge_file: mergeFileName,
											merge_file_path: response,
											size: body.fileSize,
											file_index: body.fileIndex,
										}
										//Save Sub
										SubFileTaskModel.create(subTask).then(collectD => {
											console.log('Sub task save');
										})
										console.log('file', response)
										const fileContent = fs.readFileSync(outputPath)
										console.log(fileContent);
										excludeMerges.forEach(function (filename) {
											console.log(filename);
											fs.unlinkSync('./uploads/3d-requests/' + initiateId + '/' + filename);
										})
										fs.readdir('./uploads/3d-requests/' + initiateId + '/merges', (err, Mfiles) => {
											console.log(Mfiles.length);
											if (Mfiles.length == body.totalFilesToUpload) {
												let path = './uploads/3d-requests/' + initiateId + '/merges/';
												uploadMultipleFileToS3(Mfiles, initiateId, path).then(s3FileUrl => {
													let urlsS3 = JSON.stringify(s3FileUrl);
													SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {
														FileTaskModel.update({ s3_file_url: urlsS3, internal_status: '1', reupload: '1' }, { where: { initiate_id: initiateId } }).then(taskDetails => {
															FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
																let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
																//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
															}).catch(err => {
																console.log(err)
																return apiResponse.notFoundResponse(res, err);
															})
														}).catch(err => {
															return apiResponse.notFoundResponse(res, err);
														});
													});
												}).catch(err => {
													return apiResponse.notFoundResponse(res, err);
												});

												let fileDataa = { initiateId: initiateId ? initiateId : '', S3FileUrl: '1', file3dUrl: '' };
												return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileDataa);

											}
											else {
												let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
												return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
											}
										});
									});


								}
								else {
									let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
								}
							});

						}
						else {
							fs.readdir('./uploads/3d-requests/' + initiateId, (err, files) => {
								console.log('File Length', files.length);
								if (body.totalFilesToUpload == files.length) {
									console.log('File Length is equal');
									uploadMultipleFileToS3(req.files, initiateId).then(s3FileUrl => {
										console.log('return array', s3FileUrl);
										let urlsS3 = '';
										if (s3FileUrl.length > 0) {
											urlsS3 = JSON.stringify(s3FileUrl);
										}
										SubFileTaskModel.sum('size', { where: { initiate_id: initiateId } }).then(totalSum => {

											FileTaskModel.update({ s3_file_url: urlsS3 }, { where: { initiate_id: initiateId, file_size: totalSum, internal_status: '4' } }).then(imageTaskDetails => {
												FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(details => {
													let fileData = { initiateId: details.initiate_id, collectId: (details.ep_collect_id) ? details.ep_collect_id : '', S3FileUrl: s3FileUrl, file3dUrl: '' };
													//return apiResponse.successResponseWithData(res,"Task Created Successfuly.",fileData);
												}).catch(err => {
													console.log(err)
													return apiResponse.notFoundResponse(res, err);
												})
											}).catch(err => {
												console.log(err)
												return apiResponse.notFoundResponse(res, err);
											});
										});
									}).catch(err => {
										console.log(err)
										return apiResponse.notFoundResponse(res, err);
									})
									let fileData = { initiateId: initiateId ? initiateId : '', S3FileUrl: '1', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);

								}
								else {
									let fileData = { initiateId: object.initiate_id.toString(), collectId: (object.ep_collect_id) ? object.ep_collect_id : '', S3FileUrl: '', file3dUrl: '' };
									return apiResponse.successResponseWithData(res, "Task Created Successfuly.", fileData);
								}
							});
						}
					}
					else {
						//console.log('In catch Upload block error',successResponseError)
						return apiResponse.notFoundResponse(res, "Initiate ID and user id does't match.");
					}
				}).catch(err => {
					console.log(err)
					//return apiResponse.ErrorResponse(res, err);
				});
			}).catch(err => {
				console.log(err)
				return apiResponse.ErrorResponse(res, err);
			});
		}
	}
	catch (err) {
		// if(err.code == "LIMIT_FILE_SIZE")
		// {
		// 	return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
		// }
		// else
		// {
		console.log(err);
		return apiResponse.ErrorResponse(res, `Could not upload the file: `);
		// }
	}
};



// task status
exports.completeTask = [
	// auth,

	/*
	1. EVERYPOINTDATASET
	2. EVERYPOINT
	*/
	body("initiateId").isLength({ min: 1 }).trim().withMessage("Initate id must be specified."),
	body("userId").isLength({ min: 1 }).trim().withMessage("User id must be specified."),
	body("dataSetType").isLength({ min: 1 }).trim().withMessage("Data Set Type must be specified."),
	function (req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else {
				var initiateId = req.body.initiateId;
				var userId = req.body.userId;

				FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async initiatorDetails => {

					if (!initiatorDetails) {
						return apiResponse.notFoundResponse(res, "Oops this initiate id not found within our system.");
					}
					else {
						/*if(!initiatorDetails.ep_collect_id && initiatorDetails.s3_file_url=='')
						{
				let updateData={
										
									collect_name:requestBody.collect_name,
									collect_notes:requestBody.collect_notes,
									src_type:requestBody.src_type,
									internal_status:'5'
							  }
							  FileTaskModel.update(updateData,{where: {initiate_id: initiateId}}).then(async updatedData => {
									return apiResponse.successResponseWithData(res, "Sub Task Empty");
							  });
						}
			else */
						if (!initiatorDetails.ep_collect_id) {
							var requestBody = {
								"user_id": EVP_USER_ID,
								"src_type": (req.body.dataSetType == 1) ? 'EVERYPOINT' : 'EVERYPOINTDATASET',
								//"collect_date" : new Date().toISOString().replace('T', ' ').replace(/\..*$/, ''),
								"collect_date": moment().format('YYYY-MM-DD h:mm:ss'),
								"total_assets": initiatorDetails.total_files,
								"collect_name": req.body.collect_name ? req.body.collect_name : initiatorDetails.ep_collect_id + " Data Set",
								"collect_notes": req.body.collect_notes ? req.body.collect_notes : "",
							}

							//let updateData={ep_collect_id:'12233'}
							var query = { initiate_id: initiateId };

							//FileTaskModel.update(updateData,{where: {initiate_id: initiateId}}).then(async updatedData => {             



							await makeRequest('post', 'startCollection', requestBody).then(async requestData => {
								console.log('Collect Id', requestData);
								console.log('Init Id', initiateId);
								//let updateData={ep_collect_id:requestData}
								var query = { initiate_id: initiateId };
								let updateData = {
									ep_collect_id: requestData,
									collect_name: requestBody.collect_name,
									collect_notes: requestBody.collect_notes,
									src_type: requestBody.src_type
								}

								await FileTaskModel.update(updateData, { where: { initiate_id: initiateId } }).then(async updatedData => {
									console.log(updatedData);
									SubFileTaskModel.findAll({ where: { initiate_id: initiateId } }).then(async (subTaskDetails) => {
										console.log(subTaskDetails);
										if (subTaskDetails.length > 0) {
											await subTaskDetails.forEach(async (element, index) => {
												console.log(element);
												console.log(element.merge_file);
												//var filePath = "./"+element.merge_file_path	; 
												//C:\xampp\htdocs\recon-3d-main\uploads\3d-requests\79711315\merges
												var filePath = "./uploads/3d-requests/" + initiateId + "/merges/" + element.merge_file;
												console.log(filePath);
												var fileName = element.merge_file;
												console.log(fileName);
												await uploadAssetToCollection(requestData, element.size, element.file_index, filePath, fileName).then(uploadAssets => {
													console.log('Assets', element.file_index + '  ' + fileName);
													//console.log('Upload Asseet aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',uploadAssets);
													completeCollection(requestData).then(completeC => {
														console.log('Collect Details Complete',
														);
													}).catch(err => {
														return apiResponse.ErrorResponse(res, err);
													})

												}).catch(err => {
													console.log(err);
													return apiResponse.ErrorResponse(res, err);
												})
											});
											return apiResponse.successResponseWithData(res, "Task Created Successfuly.");
										}
										else {
											return apiResponse.successResponseWithData(res, "Sub Task Empty");
											//return apiResponse.successResponseWithData(res,"");
										}
									}).catch(err => {
										return apiResponse.ErrorResponse(res, err);
									});
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								})
							}).catch(err => {
								return apiResponse.ErrorResponse(res, err);
							});
						}
						else {
							console.log('Collect Id Already Created.')

							SubFileTaskModel.findAll({ where: { initiate_id: initiateId } }).then(subTaskDetails => {
								if (subTaskDetails.length > 0) {
									subTaskDetails.forEach(async (element, index) => {
										console.log(element.merge_file);
										//var filePath = "./"+element.merge_file_path	; 
										//C:\xampp\htdocs\recon-3d-main\uploads\3d-requests\79711315\merges
										var filePath = "./uploads/3d-requests/" + initiateId + "/merges/" + element.merge_file;
										console.log(filePath);
										var fileName = element.merge_file;
										console.log(fileName);
										uploadAssetToCollection(initiatorDetails.ep_collect_id, element.size, element.file_index, filePath, fileName).then(uploadAssets => {
											completeCollection(initiatorDetails.ep_collect_id).then(completeC => {

											}).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											})

										}).catch(err => {
											return apiResponse.ErrorResponse(res, err);
										})
									});

									return apiResponse.successResponseWithData(res, "Task Created Successfuly.");
								}
								else {
									return apiResponse.successResponseWithData(res, "Sub Task Empty");
								}
							}).catch(err => {
								return apiResponse.ErrorResponse(res, err);
							});
						}





						//var filePath = "./uploads/3d-requests/merges/"+initiateId+"-merge-file"+initiatorDetails.file_ext;
						//var fileName = initiateId+"-merge-file"+initiatorDetails.file_ext;
						// console.log(filePath);

						/*
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
						}*/
					}
				});
			}
		}
		catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}
];


exports.evNewTest = [
	async function (req, res) {
		try {
			const errors = validationResult(req);
			const initiateId = 49281965;

			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
			}
			else {







				const axios = require("axios").create({ timeout: 12000000, baseURL: 'https://portal.everypoint.io/api/', timeout: 12000000, headers: { 'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ==' } });
				const filePath = './uploads/3d-requests/18162006/merges/LiDAR_Data.bin'
				const fileSize = fs.statSync(filePath).size
				console.log('file size', fileSize)
				const formData = new FormData();
				formData.append('user_id', '164');
				formData.append('collect_id', '1239732');
				formData.append('file_number', '1');
				formData.append('file_size', fileSize);
				formData.append('file', fs.createReadStream(filePath));
				// console.log(formData);

				axios.post("/uploadAssetToCollection", { timeout: 12000000 }, formData, {
					maxContentLength: Infinity, maxBodyLength: Infinity, onUploadProgress: (progressEvent) => {
						console.log('Progress Barrrrrrrrrrrrrrrrr', Math.round((progressEvent.loaded * 100) / progressEvent.total))
					}, headers: { 'Content-Type': 'multipart/form-data;boundary=' + formData.getBoundary(), }
				}).then((response) => {
					console.log(response);
					return apiResponse.ErrorResponse(res, response);
				}).catch((err) => {
					return apiResponse.ErrorResponse(res, err);
					console.log(err);
				});




			}
		}
		catch (err) {
			console.log('In catch block error', err)
			return apiResponse.ErrorResponse(res, err);
		}
	}
];


exports.getScanList = [
	//auth,	
	function (req, res) {
		try {
			var userId = parseInt(req.query.userId, 10);
			var pageNo = parseInt(req.query.pageNo, 10);
			var pagingLimit = parseInt(req.query.limit, 10);
			var pagingOffset = (pageNo - 1) * pagingLimit;

			if (!userId) {
				return apiResponse.notFoundResponse(res, "Provide a user id.");
			}
			else {
				var initiateData = [];
				var queryTask = { user_id: userId };
				FileTaskModel.findAndCountAll({ where: queryTask, offset: pagingOffset, limit: pagingLimit, order: [['id', 'DESC']] }).then(fileDetails => {

					if (fileDetails.count > 0) {
						fileDetails.rows.forEach((element, index) => {
							var finalU = [];
							var final3dU = [];
							console.log(element.s3_file_url);
							if (!element.s3_file_url) {
								var finalU = [];
							}
							else {
								finalU = JSON.parse(element.s3_file_url).map((item) => {
									// return item.replace('3d-requests-assets.s3.ap-south-1.amazonaws.com', 'd2k0dlvz7pfmm9.cloudfront.net')
									return item
								});
							}

							if (!element.s3_3d_url) {
								var final3dU = [];
							}
							else {
								final3dU = JSON.parse(element.s3_3d_url).map((item) => {
									// return item.replace('3d-requests-assets.s3.ap-south-1.amazonaws.com', 'd2k0dlvz7pfmm9.cloudfront.net')
									return item
								});
							}

							let isExpired = true;

							let createdAt = moment(element.createdAt).format("YYYY-MM-DD");
							let currentDate = moment().format("YYYY-MM-DD")
							var next3MonthsDate = moment(createdAt).add(3, "month").format("YYYY-MM-DD");
							//console.log(next3MonthsDate)
							if (currentDate <= next3MonthsDate && currentDate >= createdAt) {
								isExpired = false;
							}

							var profileImg = configFile.getBaseUrl() + constants.path.profileViewPath + 'default.png';
							if (element.user_profile_pic) {
								var profileImg = configFile.getBaseUrl() + constants.path.profileViewPath + 'default.png';
							}
							var scanImg = configFile.getBaseUrl() + constants.path.profileViewPath + element.user_profile_pic;
							let initiateDataa = {
								initiateId: element.initiate_id,
								userId: element.user_id,
								user_name: '',
								title: element.collect_name ? element.collect_name : '',
								user_image: profileImg,
								description: element.collect_notes ? element.collect_notes : '',
								time: element.createdAt ? moment(element.createdAt).format('DD-MM-YYYY h:mm:ss A') : '',
								thumbnail_image: scanImg,
								thumbnail_video: '',
								fileSize: element.file_size ? element.file_size : '',
								fileType: element.file_type ? element.file_type : '',
								fileExt: element.file_ext ? element.file_ext : '',
								totalChunks: element.chunks ? element.chunks : 0,
								leftChunks: element.left_chunk ? element.left_chunk : 0,
								s3FileUrl: element.s3_file_url ? finalU : [],
								file3dUrl: element.s3_3d_url ? final3dU : [],
								status: (element.internal_status == 0) ? 'Processing' : ((element.internal_status == 1) ? 'Failure' : ((element.internal_status == 2) ? 'Completed' : '')),
								shouldReupload: (element.reupload == 2) ? true : false,
								next3MonthsDate: next3MonthsDate,
								isExpired: isExpired
							};

							initiateData.push(initiateDataa);
						});
						return apiResponse.successResponseWithData(res, "File Details.", initiateData);
					}
					else {
						return apiResponse.successResponseWithData(res, "Data Not Found.", initiateData);
					}
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				});
			}
		}
		catch (err) {
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

const uploadFileToS3 = async (buffer, folderName, name, type) => {

	let bucketPath = folderName + '/' + name;
	console.log(bucketPath)
	const params = {
		ACL: 'public-read',
		StorageClass: 'STANDARD',
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

const uploadMultipleFileToS3 = async (files, folderName, pathU = null) => {
	var responseData = [];
	return await Promise.all(
		files.map(async (item) => {
			console.log(item);
			console.log(pathU);
			if (pathU) {
				var bucketPath = encodeURIComponent(folderName) + '/' + item;
				console.log(bucketPath);
				var fileContent = fs.readFileSync(pathU + item)
			}
			else {
				var bucketPath = encodeURIComponent(folderName) + '/' + item.originalname;
				var fileContent = fs.readFileSync(item.path)
			}

			var params = {
				Bucket: bucketName,
				Key: bucketPath,
				Body: fileContent,
				ACL: 'public-read',
				StorageClass: 'STANDARD',
			};
			return await s3.upload(params).promise()
		})
	).then(data => {
		console.log('s3 data is', data)
		data.map(async (item) => {
			return responseData.push(item.Location)
		})
		return responseData
	}).catch(s3Error => {
		console.log('S3 Error', s3Error)
		return s3Error
	});
};

const makeRequest = async (method, apiEndpoint, curlBody = null, header = null) => {
	console.log(apiEndpoint, curlBody)
	return await axios.post('/' + apiEndpoint, curlBody).then(function (response) {
		console.log(response.data.collect_id);
		return response.data.collect_id;
	}).catch(function (error) {
		return error;
	});
}

const uploadAssetToCollection = async (collectId, fileSize, fileNumber, filePath, fileName) => {
	const formData = new FormData();
	const fileSizee = fs.statSync(filePath).size;
	formData.append('user_id', EVP_USER_ID);
	formData.append('collect_id', collectId);
	formData.append('file_number', fileNumber);
	formData.append('file_size', fileSizee);
	formData.append('file', fs.createReadStream(filePath));
	console.log('Formmmmmmmmmmmmmmmmmmmmmmmmm Data', formData);
	console.log('Uploadingggggggggggggggg', fileName);

	return await axios.post("/uploadAssetToCollection", formData, {
		maxContentLength: Infinity, maxBodyLength: Infinity, onUploadProgress: (progressEvent) => {
			console.log('Progress Barrrrrrrrrrrrrrrrr', Math.round((progressEvent.loaded * 100) / progressEvent.total))
		}, headers: { 'Content-Type': 'multipart/form-data;boundary=' + formData.getBoundary(), }
	}).then(async (res) => {


		console.log('All commpleteeeeeeeeeeeeeeeeee', res);
	}).catch((err) => {
		console.log('Upload error', err);
		return err;
	});
}

const completeCollection = async (collectId) => {
	var requestBody = {
		"user_id": EVP_USER_ID,
		"collect_id": collectId
	}
	//console.log(requestBody);
	await makeRequest('post', 'endCollection', requestBody).then(requestData => {
		console.log('Response', requestData.data);
		return requestData.data;
	}).catch(err => {
		return err;
	});


}

const checkCollectionStatus = async (collectId) => {
	var requestBody = {
		"user_id": EVP_USER_ID,
		"collect_id": collectId
	}
	//console.log(requestBody);
	makeRequest('post', 'checkCollectionStatus', requestBody).then(requestData => {
		console.log('Response', requestData.data);
		return requestData.data;
	}).catch(err => {
		return apiResponse.ErrorResponse(res, err);
	});
}

const changes3Url = async (myArray) => {
	result = []
	await myArray.map((item) => {
		result.push(item.replace('3d-requests-assets.s3.ap-south-1.amazonaws.com', 'd2k0dlvz7pfmm9.cloudfront.net'))
	});
	console.log(result)
};


exports.downloadAssets12 = [
	//auth,	
	async function (req, res) {
		try {
			var userId = parseInt(req.query.userId, 10);
			var initiateId = req.query.initiateId;

			if (!userId) {
				return apiResponse.notFoundResponse(res, "Provide a user id.");
			}
			else {
				FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async initiatorDetails => {
					if (!initiatorDetails) {
						return apiResponse.notFoundResponse(res, "Oops this initiate id not found within our system.");
					}
					else {
						console.log('We r in')
						const params = {
							Bucket: bucketName,
							Prefix: initiateId + "/"
						}
						console.log(params)
						const filesArray = []
						const files = await s3.listObjectsV2(params).promise()
						console.log('Files', files);
						await files.Contents.forEach((item, index) => {
							console.log('Arr', item);

							let text = item.Key;
							let position = text.search("3DObject");
							if (position == '-1') {
								filesArray.push(item.Key.split("/").pop());
							}

						});



						await createZipFileFromS3(filesArray, initiateId + '/', initiateId).then(async (data) => {
							//console.log(data);
							//console.log(BASE_URL+data.path.replace(/\\/g, "/"));

							var resP = '';

							if (data.path) {
								resP = {
									path: BASE_URL + data.path.replace(/\\/g, "/"),
								}
							}
							else {
								resP = {
									path: '',
								}
							}
							//console.log(resP);
							//req.setTimeout(50000);

							return apiResponse.successResponseWithData(res, "File Details.", resP);
						}).catch(err => {
							console.log('ErrrS3', err);
							return apiResponse.ErrorResponse(res, err);
						})

					}
				}).catch(err => {
					return apiResponse.ErrorResponse(res, err);
				});
			}
		}
		catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];


const createZipFileFromS312 = async (files, folderName, initiateId) => {
	const output = fs.createWriteStream(join('./downloads', `${initiateId}-assets.zip`))

	return new Promise((resolve, reject) => {
		var stream = s3Zip.archive({ s3: s3, bucket: bucketName, debug: true }, folderName, files).pipe(output)
		// stream.on('data', function (record) {
		//     client.delete(record);
		// })
		stream.on('error', function (error) {
			console.log('errororo');
			reject(error);
		})
		stream.on('finish', function () {
			//sconsole.log('promise return',output.path)
			return resolve(output);

		})

	}).catch(err => {
		console.log('Error', err);
		//return apiResponse.ErrorResponse(res, err);
	});

};

exports.downloadAssets = [
	//auth,	
	async function (req, res) {
		try {
			var userId = parseInt(req.query.userId, 10);
			var initiateId = req.query.initiateId;

			if (!userId) {
				return apiResponse.notFoundResponse(res, "Provide a user id.");
			}
			else {
				FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async initiatorDetails => {
					if (!initiatorDetails) {
						return apiResponse.notFoundResponse(res, "Oops this initiate id not found within our system.");
					}
					else {
						console.log('We r in')
						const params = {
							Bucket: bucketName,
							Prefix: initiateId + "/"
						}
						console.log(params)
						const filesArray = []
						const files = await s3.listObjectsV2(params).promise()
						console.log('Files', files);
						await files.Contents.forEach((item, index) => {
							console.log('Arr', item);

							let text = item.Key;
							let position = text.search("3DObject");
							if (position == '-1') {
								filesArray.push(item.Key.split("/").pop());
							}

						});


						var pathAsset = BASE_URL + 'downloads/' + initiateId + '-assets.zip';

						pathAsset = {
							path: pathAsset,
						}
						createZipFileFromS3(filesArray, initiateId + '/', initiateId).then(async (data) => {
							//console.log(data);
							//console.log(BASE_URL+data.path.replace(/\\/g, "/"));

							var resP = '';

							if (data.path) {
								resP = {
									path: BASE_URL + data.path.replace(/\\/g, "/"),
								}
							}
							else {
								resP = {
									path: '',
								}
							}
							//console.log(resP);
							//req.setTimeout(50000);

							//return  apiResponse.successResponseWithData(res,"File Details.", resP);
						}).catch(err => {
							console.log('ErrrS3', err);
							//return  apiResponse.ErrorResponse(res, err);
						});
						return apiResponse.successResponseWithDataInstant(res, "File Details..", pathAsset);

					}
				}).catch(err => {
					return apiResponse.ErrorResponse(res, err);
				});
			}
		}
		catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];
const createZipFileFromS3 = async (files, folderName, initiateId) => {
	const output = fs.createWriteStream(join('./downloads', `${initiateId}-assets.zip`))

	return new Promise((resolve, reject) => {
		var stream = s3Zip.archive({ s3: s3, bucket: bucketName, debug: true }, folderName, files).pipe(output)
		// stream.on('data', function (record) {
		//     client.delete(record);
		// })
		stream.on('error', function (error) {
			console.log('errororo');
			reject(error);
		})
		stream.on('finish', function () {
			//sconsole.log('promise return',output.path)
			return resolve(output);

		})

	}).catch(err => {
		console.log('Error', err);
		//return apiResponse.ErrorResponse(res, err);
	});

};

exports.downloadObjects = [
	//auth,	
	async function (req, res) {
		try {
			var userId = parseInt(req.query.userId, 10);
			var initiateId = parseInt(req.query.initiateId, 10);

			if (!userId) {
				return apiResponse.notFoundResponse(res, "Provide a user id.");
			}
			else {
				FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async initiatorDetails => {

					if (!initiatorDetails) {
						return apiResponse.notFoundResponse(res, "Oops this initiate id not found within our system.");
					}
					else if (!initiatorDetails.s3_file_url) {
						resP = {
							'downloadStatus': 'fail',
						}

						return apiResponse.notFoundResponse(res, "File Details.", resP);
					}
					else {
						console.log('We r in')
						const params = {
							Bucket: bucketName,
							Prefix: initiateId + "/3DObject/"
						}

						if (initiatorDetails.s3_3d_url && initiatorDetails.s3_3d_url != '' && initiatorDetails.s3_3d_url != null) {
							const filesArray = []
							const files = await s3.listObjectsV2(params).promise()
							await files.Contents.forEach((item, index) => {

								filesArray.push(item.Key.split("/").pop());

							});


						}


					}
				}).catch(err => {
					return apiResponse.ErrorResponse(res, err);
				});
			}
		}
		catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
];


const createZipFileFromS3D = async (files, folderName, initiateId) => {
	const output = fs.createWriteStream(join('./downloads', `${initiateId}-objects.zip`))

	return new Promise((resolve, reject) => {
		var stream = s3Zip.archive({ s3: s3, bucket: bucketName, debug: true }, folderName, files).pipe(output)
		// stream.on('data', function (record) {
		//     client.delete(record);
		// })
		stream.on('error', function (error) {
			reject(error);
		})
		stream.on('finish', function () {
			console.log('promise return', output)
			resolve(output);
		})
	})

};

const getThumbnailFromVideo = async (inputPath, outputPath, initiateId = null) => {
	return new Promise((resolve, reject) => {
		var createThumb = new ffmpeg(inputPath);
		createThumb.then(function (video) {
			video.fnExtractFrameToJPG(outputPath, {
				frame_rate: 1,
				number: 1,
				start_time: 3,
				//size : 1080,
				file_name: initiateId + '-thumbnail'
			}, function (error, files) {
				reject('Video Object' + error)
				if (!error)
					resolve('Generated Frame: ' + files);
			});
		}, function (err) {
			reject('Error From Thumbnail: ' + err);
		});
	})
};



// update prioririty
// exports.priorityUpdate = async (req, res) => {
// 	try {
// 		const { initiate_id, priority } = req.body;
// 		const checkId = FileTaskModel.findOne({ where: { initiate_id } });
// 		console.log("checkId", checkId);
// 		if (checkId) {
// 			const updateData = await FileTaskModel.update({ priority }, { where: { initiate_id } });
// 			console.log("updateData", updateData);
// 			return apiResponse.successResponseWithData(res, "Updated successfully.");
// 		}
// 		else {
// 			return res.status(400).send("Initiate Id not exist!!");
// 		}
// 	} catch (err) {
// 		return apiResponse.ErrorResponse(res, err);
// 	}
// };








