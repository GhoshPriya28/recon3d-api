require('dotenv').config();
const { BASE_URL,EVP_API_VERSION,EVP_BASE_URL,EVP_USER_ID,EVP_CUSTOMER_ID,EVP_API_USERNAME,EVP_API_PASSWORD,EVP_API_SRC_TYPE,FCM_KEY} = process.env;
const db = require("../models");
const { UserModel: UserModel,FileTaskModel:FileTaskModel,TaskListModel:TaskListModel,SubFileTaskModel:SubFileTaskModel,CollectListModel:CollectListModel,CollectDetailModel:CollectDetailModel,EmailTamplateModel: EmailTamplateModel,PreCompleteTaskModel:PreCompleteTaskModel} = db;
const Op = db.Sequelize.Op;
const fs = require('fs');
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const multer  = require('multer');
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const notificationUtility = require("../helpers/pushNotification");
const mailer = require("../helpers/mailer");
const path = require('url');
const paths = require('path');
const auth = require("../middlewares/jwt");
const { fsMerge } = require('split-chunk-merge');
const uploadFile = require("../middlewares/upload");
const FormData = require('form-data');
var form = new FormData();
const join = require('path').join;
const s3Zip = require('s3-zip');
var FCM = require('fcm-node');
var moment=require('moment');
var rimraf = require("rimraf");
const everypointProcess = require("../helpers/everypointProcess");
const { constants } = require("../helpers/constants");
const everypointProcess1 = require("../helpers/everypointProcess2");

var password = EVP_API_USERNAME+':'+EVP_API_PASSWORD;
var encodedPassword = Buffer.from(password).toString('base64');

const axios = require("axios").create({baseURL: EVP_BASE_URL, headers: {'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ=='}});
const S3 = require('aws-sdk/clients/s3');
const { devNull } = require('os');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

var moment=require('moment');

const s3 = new S3({
	region,
	accessKeyId,
	secretAccessKey,
  });
exports.dataCollect= [
	(req, res) => {
		// Validate fields.
	
	body("collect_id").isLength({ min: 1 }).trim().withMessage("Collect id must be specified."),
	body("collect_status").isLength({ min: 1 }).trim().withMessage("Collect Status id must be specified."),
    body("assets").isLength({ min: 1 }).trim().withMessage("Assets id must be specified.")
	try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				
				if(req.body.collect_id=='')
				{
					return apiResponse.notFoundResponse(res, 'Collect id must be specified.');
				}
				else if(req.body.collect_status=='')
				{
					return apiResponse.notFoundResponse(res, 'Collect Status id must be specified.');
				}
				else if(req.body.assets=='')
				{
                    return apiResponse.notFoundResponse(res, 'Assets id must be specified.');
				}
				else
				{

					const collect = 
                    {
                        collect_id: req.body.collect_id,
                        status: req.body.collect_status
                    }
					
					
					
                     CollectListModel.findOrCreate({where:{collect_id: req.body.collect_id},defaults: collect}).then(collectD => {
						FileTaskModel.findOne({where: {ep_collect_id: req.body.collect_id}}).then(collect => {

						if(collect)
							{
								CollectDetailModel.destroy({where:{collect_id: req.body.collect_id}}).then(collect => {
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								})
								var status='1'; 
								if(req.body.collect_status=='COMPLETE')
								{
									status='2';
								}
								if(req.body.assets)
					            {
					            	
					            }
					            else
					            {
					            	status='3';
					            }
							    var initiateId = collect.initiate_id;
								FileTaskModel.update({internal_status:status},{where: {ep_collect_id: req.body.collect_id}}).then(updatedData => {
									var responseData=[];
                                    
                                    var countA=1;
									if(req.body.assets)
									{
										let fileLength=req.body.assets.length;
										req.body.assets.forEach(function(item) {
										var collectD = {
											collect_id: req.body.collect_id,
											asset_name: item.asset_name,
											asset_type: item.asset_type,
											asset_extension: item.asset_extension,
											asset_size: item.asset_size,
											asset_url: item.asset_url,
										}
										//console.log(collectD);
										CollectDetailModel.create(collectD).then(list=>{
											
												console.log(list.length);
												
												
													 file =item.asset_url;
													 
													var new_name= collect.collect_name.replace('.', '_')+'.'+item.asset_extension;
													var putUrl=initiateId+'/3DObject/'+new_name;
													put_from_url(file,bucketName,putUrl).then(s3DOFileUrl => {
														
														responseData.push(s3DOFileUrl.Location);
														console.log('S33333',s3DOFileUrl);
														var urlsS3D=JSON.stringify(responseData);
														
														FileTaskModel.update({s3_3d_url:urlsS3D,reupload:'1'},{where: {initiate_id: initiateId}}).then(updatedData => {

															rimraf("./uploads/3d-requests/"+initiateId, function () { console.log("Delete Folder done"); });
														   if(fileLength==countA++)
															{
																UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																EmailTamplateModel.findOne({where: { id: '3'} }).then((tamplate) => {
																	var html='';
																		if(req.body.assets)
																		{
																			console.log(responseData);
																			let link1='';
																			let link2='';
																			if(responseData[0])
																			{
																				link1="<a href="+responseData[0]+" target='_blank'  rel='noreferrer'>Click here to Download Point Cloud ("+responseData[0].match(/\.([^\./\?]+)($|\?)/)[1]+")</a><br>";
																			}
																			if(responseData[0])
																			{
																				//link2="<a href="+responseData[1]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseData[1].match(/\.([^\./\?]+)($|\?)/)[1]+")</a><br>";
																			}
																			 html = "Your Collect Name: " + collect.collect_name + "<br><br>"  + link1+link2;
																			var title='Recon-3D | Your data is ready!';
																		}
																		else
																		{
																			 html = "Your uploading failed  : " + collect.collect_name + "<br>" ;
																			 var title='Recon-3D | Your data Uploading Failed';
																		}
																	
																	var tamplate=tamplate.content;
																	var fullname=userD.first_name
																	if(userD.last_name!='' && userD.last_name!=null)
																	{
																		fullname=userD.first_name+' '+userD.last_name;
																	}
							                                  	    tamplate = tamplate.replace('Username',fullname); 
							                                  	    tamplate = tamplate.replace('Content',html);
							                                  	    tamplate = tamplate.replace('Download_label','You can also download your data at the link below:');
																	  mailer.send(
																		constants.confirmEmails.from, 
																		//'zunedgkp@gmail.com',
																		 userD.email,
																		 title,
																		tamplate
																		).then(function() {
																		}).catch(err => {
																			console.log(err)
																			return apiResponse.ErrorResponse(res, err);
																		});
																		
																		
																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
							                                            

																		};
																		
																		if(userD.user_firebase_id)
																		{
																			var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,title,data);
																		}
																}).catch(err => {
																	return apiResponse.notFoundResponse(res, err);
																})
																//console.log(userD);
															}).catch(err => {
																return apiResponse.notFoundResponse(res, err);
															})
															}
														}).catch(err => {
															return apiResponse.notFoundResponse(res, err);
														})
														
														
													}).catch(err => {
														return apiResponse.ErrorResponse(res, err);
													})
							
												
												//console.log(responseData);
											  
										}).catch(err => {
											console.log(err)
											return apiResponse.ErrorResponse(res, err);
										});
				
									    })
									}
									else
									{
										UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
										EmailTamplateModel.findOne({where: { id: '3'} }).then((tamplate) => {
											var html='';
												
											html = "Your uploading failed  : " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>";
											var title='Uploading Failed';
												
											
											var tamplate=tamplate.content;
											tamplate = tamplate.replace('Your data has finished processing. You can view the the result by navigating to the scan within the Recon 3D app and clicking on Download Cloud Model button, or you can share it to another service or folder.','');
	                                  	    tamplate = tamplate.replace('Username',userD.first_name+' '+userD.last_name); 
	                                  	    tamplate = tamplate.replace('Content',html);
	                                  	    tamplate = tamplate.replace('Download_label','');
	                                  	    tamplate = tamplate.replace('Your Data is Ready',title);
											  mailer.send(
												constants.confirmEmails.from, 
												 userD.email,
												 title,
												tamplate
												).then(function() {
												}).catch(err => {
													console.log(err)
													return apiResponse.ErrorResponse(res, err);
												});

												
												
												var data={
												initiate_id:collect.initiate_id,
												collect_id:collect.ep_collect_id,
												collect_name:collect.collect_name,
	                                            

												};
												
												if(userD.user_firebase_id)
												{
													var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,title,data);
												}
										});
									    });
									}
									
									
									
								}).catch(err => {
									console.log(err)
									return apiResponse.ErrorResponse(res, err);
								});


                                

								return apiResponse.successResponseWithData(res,"Submitted.");
							}
						}); 
						
					}).catch(err => {
						console.log(err)
						return apiResponse.ErrorResponse(res, err);
					});
				}
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
		
	}
];


const put_from_url= async(url, bucket, key)=>{
	
	return await axios.get(url, { responseType: "arraybuffer", responseEncoding: "binary" }).then((response) => {
		const params = {
		  ContentType: response.headers["content-type"],
		  ContentLength: response.data.length.toString(), // or response.header["content-length"] if available for the type of file downloaded
		  Bucket: bucket,
		  Body: response.data,
		  Key: key,
		};
		return  s3.upload(params).promise();
	  }).catch(err => {
		  console.log(err);
		return apiResponse.ErrorResponse(res, err);
	});
	
};

exports.downloadObjects = [
	//auth,	
	function (req, res)
	{
		try{
            var initiate_id = req.query.initiateId;
            if (!initiate_id)
            {
				return apiResponse.notFoundResponse(res, "Provide a Initiate id.");
			}
			else
			{
				
				var queryTask = {initiate_id:initiate_id};
				FileTaskModel.findOne({where: queryTask}).then(element => {

					   if(!element.s3_3d_url && element.internal_status==3)
					   {
						      var final3dU=[];

				              return apiResponse.successResponseWithDownload(res,"File Details.",'fail',final3dU);
					   }
					   else if(element.s3_file_url && element.internal_status==0)
					   {
                              var final3dU=[];

				              return apiResponse.successResponseWithDownload(res,"File Details.",'processing',final3dU);
					  
					   }
					   else
					   {
					   	  var final3dU=[];
					      if(!element.s3_3d_url)
							{
                              var final3dU=[];
							}
							else
							{
								final3dU = JSON.parse(element.s3_3d_url).map((item) => {
	                 // return item.replace('3d-requests-assets.s3.ap-south-1.amazonaws.com', 'd2k0dlvz7pfmm9.cloudfront.net')
	                                return item
	                             });
							}
							let initiateDataa = {
								file3dUrl:element.s3_3d_url ? final3dU: [],
							};
							return apiResponse.successResponseWithData(res,"File Details.", initiateDataa);


					   }

					    
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				});
			}
		}
		catch (err)
		{
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	}
];



exports.deleteObjects= [
	(req, res) => {
        
		
		if(req.params.initiate_id)
		{
			var queryTask = {initiate_id:req.params.initiate_id};
			console.log(queryTask);
			FileTaskModel.findOne({where: queryTask}).then(element => {
               if(element)
			   {
				FileTaskModel.destroy({where:{initiate_id: req.params.initiate_id}}).then(collect => {
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				});
				return apiResponse.successResponseWithData(res,"Deleted Successfully.");
			   }
			   else
			   {
				return apiResponse.notFoundResponse(res, "Initiate id not exit.");
			   }
			}).catch(err => {
				console.log(err);
				return apiResponse.ErrorResponse(res, err);
			});
			
		}
		else
		{
			return apiResponse.notFoundResponse(res, "Initiate id must be specified.");
		}
		
		
	}
];



exports.callbackOld= [
	async function(req, res){
		try{
			if(req.body.data)
				{
				/*var randomNum = Math.ceil(Math.random() * 999999);
				var save=JSON.stringify(req.body.data);
				fs.writeFile("Test"+randomNum+".log", save, function(err) {
					if(err) {
						return console.log(err);
					}
					return apiResponse.successResponseWithData(res,"Submitted.");
					
				});
				*/
				//var data={"job":{"id":"jobs90f2e7d5-c210-11ec-acd8-02ae39e1a57f","status":"complete","inputs":["/videos/8ec9e56a-c210-11ec-acd8-02ae39e1a57f"],"outputs":["/meshes/a1fe3412-c210-11ec-acd8-02ae39e1a57f"],"function":"/functions/pixels-to-mesh","settings":{"output_file_types":["obj"]}}};
				console.log(req.body.data);
				const collect = 
                    {
                        collect_id:req.body.data.job.id,
                        callback_data:JSON.stringify(req.body.data),
                        status: req.body.data.job.status
                    }
					
				CollectListModel.findOrCreate({where:{collect_id: req.body.data.job.id},defaults: collect}).then(async collectD => {
					
					FileTaskModel.findOne({where: {ep_collect_id: req.body.data.job.id}}).then(async collect => {
						if(collect)
						{
					    let initiateId=collect.initiate_id;
						if(req.body.data.job.status=='complete')
						{
							
							var endPoint=EVP_BASE_URL+EVP_API_VERSION;
							
							var outputs=req.body.data.job.outputs;
							let fileLength=outputs.length;
							var countA=1;
							var responseDataa=[];
							for(let i=0;i<outputs.length; i++){
								//console.log(endPoint+outputs[i]);
								result = await everypointProcess.makeGetRequestNew(outputs[i]).then(async responseData => {
									console.log('Res Data',responseData.data);
									console.log('Asset name',responseData.data);
									let allData=Object.values(responseData.data.data);
									console.log('All data',allData[0]);
										let file=allData[0].url;
										let initiateId=collect.initiate_id;
										
										
										let name=allData[0].name;
										//let newName=name+'.'+allData[0].type;
										console.log('Puttttt Collect',collect.collect_name);
										console.log('Puttttt',allData[0]);
										//var new_name= collect.collect_name.replace('.', '_')+'.'+allData[0].type;
										//console.log('New Name',new_name);
										var putUrl=initiateId+'/3DObject/'+collect.collect_name.replace('.', '_')+'.'+allData[0].type;
										
										console.log('file Name',file);
										console.log('Put url Name',putUrl);
										put_from_url(file,bucketName,putUrl).then(async(s3DOFileUrl) => {
											//console.log(s3DOFileUrl);
											//responseData.push(s3DOFileUrl.Location);
											
											
											
											responseDataa.push(s3DOFileUrl.Location);
														console.log('Response Dataaaaaaaaaaaa',responseData);
											  var urlsS3D=JSON.stringify(responseDataa);
											  await FileTaskModel.update({s3_3d_url:urlsS3D,internal_status:'2',reupload:'1'},{where: {initiate_id: initiateId}}).then(updatedData => {
												//console.log(fileLength);
												//console.log(countA++);
											
													if(fileLength==countA++)
															{
																rimraf("./uploads/3d-requests/"+initiateId, function () { console.log("Delete Folder done"); });
																UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																	console.log(userD);
																EmailTamplateModel.findOne({where: { id: '3'} }).then((tamplate) => {
																	var html='';
																		
																			let link1='';
																			let link2='';
																			if(responseDataa[0])
																			{
																				link1="<a href="+responseDataa[0]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseDataa[0].match(/\.([^\./\?]+)($|\?)/)[0]+")</a><br>";
																			}
																			if(responseDataa[1])
																			{
																				//link2="<a href="+responseDataa[1]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseDataa[1].match(/\.([^\./\?]+)($|\?)/)[1]+")</a><br>";
																			}
																			
																		    html = "Your Collect Name: " + collect.collect_name + "<br>"  + link1+link2;
																			var title='Recon-3D | Your data is ready!';

																		
																		
																		var tamplate=tamplate.content;

																		var fullname=userD.first_name
																		if(userD.last_name!='' && userD.last_name!=null)
																		{
																			fullname=userD.first_name+' '+userD.last_name;
																		}
																		tamplate = tamplate.replace('Username',fullname); 
																		tamplate = tamplate.replace('Content',html);
																		 tamplate = tamplate.replace('Download_label','You can also download your data at the link below:');
																	    mailer.send(
																		constants.confirmEmails.from,
																		//"zunedgkp@gmail.com",
																		 userD.email,
																		 title,
																		tamplate
																		).then(function() {
																		});

																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
																		};
																		
																		if(userD.user_firebase_id)
																		{
																			var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,title,data);
																		}
																}).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
																//console.log(userD);
															    }).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
															}
												
											  }).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											  })
											
										}).catch(evError => {
											console.log('Upload S3 Error',evError)
											reject(evError)
										})
										
									//console.log(responseData);
								}).catch(evError => {
									console.log('Upload Response Error',evError);
									return apiResponse.ErrorResponse(res, err);
									reject(evError)
								})
							}
							//console.log(typeof(req.body.data.job.outputs));
							//var initiateForm=req.body.data.job.outputs[0];
							
						}
						else
						{
 							FileTaskModel.update({internal_status:'3'},{where: {initiate_id: initiateId}}).then(updatedData => {
                                 UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																	console.log(userD);

																EmailTamplateModel.findOne({where: { id: '5'} }).then((tamplate) => {
																	var html='';
																	    var title='Processing failed';
																		if(req.body.data)
																		{
																			let link1='';
																			let link2='';
																			
																			 html = "Your Collect Name: " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>" + link1+link2;
																			var title='Recon-3D | Your Data Processing Failed!';
																		}
																		else
																		{
																			html = "Your uploading failed  : " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>";
																			var title='Recon-3D | Your Data Processing Failed';
																		}
																	     //html ="Your upload for scan " + collect.collect_name + " has failed. We couldn’t get the complete data at our end and hence your scan cannot be processed."+"<br><br>"+"<br>"+"";
																		 html ="Our system couldn’t successfully generate a 3D model from your scan "+'"'+collect.collect_name+'"'+". We request you to try scanning again.<br>";
																		var tamplate=tamplate.content;

																		var fullname=userD.first_name
																		if(userD.last_name!='' && userD.last_name!=null)
																		{
																			fullname=userD.first_name+' '+userD.last_name;
																		}
																		
																		tamplate = tamplate.replace('Username',fullname); 
																		//tamplate = tamplate.replace('Your data has finished processing. You can view the the result by navigating to the scan within the Recon 3D app and clicking on Download Cloud Model button, or you can share it to another service or folder.',''); 
																		tamplate = tamplate.replace('Content',html);
																		tamplate = tamplate.replace('Download_label','');
																	    tamplate = tamplate.replace('Your Data is Ready',title);
																	    mailer.send(
																		constants.confirmEmails.from, 
																		//"zunedgkp@gmail.com",
																		userD.email,
																		 title,
																		tamplate
																		).then(function() {
																		});

																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
																		};
																		
																		if(userD.user_firebase_id)
																		{
																			var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,title,data);
																		}
																}).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
																//console.log(userD);
															    }).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})

							}).catch(err => {
									console.log(err);
									return apiResponse.ErrorResponse(res, err);
							})
						}
						return apiResponse.successResponseWithData(res,"Submitted.");
						}
						
					}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				    })
					
					
				 
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				})
				
				//console.log(req.body.data);

				}
				else
				{
				console.log("Empty Post!");
				}
		}
		catch (err)
		{
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
		
		
		}
]


exports.callback= [
	async function(req, res){
		try{
			if(req.body.data)
				{
				//var data={"job":{"id":"jobs90f2e7d5-c210-11ec-acd8-02ae39e1a57f","status":"complete","inputs":["/videos/8ec9e56a-c210-11ec-acd8-02ae39e1a57f"],"outputs":["/meshes/a1fe3412-c210-11ec-acd8-02ae39e1a57f"],"function":"/functions/pixels-to-mesh","settings":{"output_file_types":["obj"]}}};
				console.log(req.body.data);
				const collect = 
                    {
                        collect_id:req.body.data.job.id,
                        callback_data:JSON.stringify(req.body.data),
                        status: req.body.data.job.status
                    }
					
				    CollectListModel.findOrCreate({where:{collect_id: req.body.data.job.id},defaults: collect}).then(async collectD => {
					
					FileTaskModel.findOne({where: {ep_collect_id: req.body.data.job.id}}).then(async collect => {
						if(collect)
						{
					    let initiateId=collect.initiate_id;
						if(req.body.data.job.status=='complete')
						{
							
							var endPoint=EVP_BASE_URL+EVP_API_VERSION;
							
							var outputs=req.body.data.job.outputs;
							let fileLength=outputs.length;
							var countA=1;
							var responseDataa=[];
							for(let i=0;i<outputs.length; i++){
								//console.log(endPoint+outputs[i]);
								result = await everypointProcess.makeGetRequestNew(outputs[i]).then(async responseData => {
									console.log('Res Data',responseData.data);
									console.log('Asset name',responseData.data);
									let allData=Object.values(responseData.data.data);
									console.log('All data',allData[0]);
										let file=allData[0].url;
										let initiateId=collect.initiate_id;
										
										
										let name=allData[0].name;
										//let newName=name+'.'+allData[0].type;
										console.log('Puttttt Collect',collect.collect_name);
										console.log('Puttttt',allData[0]);
										//var new_name= collect.collect_name.replace('.', '_')+'.'+allData[0].type;
										//console.log('New Name',new_name);
										var putUrl=initiateId+'/3DObject/'+collect.collect_name.replace('.', '_')+'.'+allData[0].type;
										
										console.log('file Name',file);
										console.log('Put url Name',putUrl);
										put_from_url(file,bucketName,putUrl).then(async(s3DOFileUrl) => {
											//console.log(s3DOFileUrl);
											//responseData.push(s3DOFileUrl.Location);
											
											
											
											responseDataa.push(s3DOFileUrl.Location);
														console.log('Response Dataaaaaaaaaaaa',responseData);
											  var urlsS3D=JSON.stringify(responseDataa);


											  console.log('scccccccccccc',urlsS3D);
											  await FileTaskModel.update({s3_3d_url:urlsS3D,internal_status:'2',reupload:'1'},{where: {initiate_id: initiateId}}).then(updatedData => {
												//console.log(fileLength);
												//console.log(countA++);
											
													if(fileLength==countA++)
															{
																rimraf("./uploads/3d-requests/"+initiateId, function () { console.log("Delete Folder done"); });
																UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																	console.log(userD);
																EmailTamplateModel.findOne({where: { id: '3'} }).then((tamplate) => {
																	var html='';
																		
																			let link1='';
																			let link2='';
																			if(responseDataa[0])
																			{
																				link1="<a href="+responseDataa[0]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseDataa[0].match(/\.([^\./\?]+)($|\?)/)[0]+")</a><br>";
																			}
																			if(responseDataa[1])
																			{
																				//link2="<a href="+responseDataa[1]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseDataa[1].match(/\.([^\./\?]+)($|\?)/)[1]+")</a><br>";
																			}
																			
																		    html = "Your Collect Name: " + collect.collect_name + "<br>"  + link1+link2;
																			var title='Point Precise | Your data is ready!';
																			var notification_title="Your "+ collect.collect_name +" scan is ready";

																		
																		
																		var tamplate=tamplate.content;

																		var fullname=userD.first_name
																		if(userD.last_name!='' && userD.last_name!=null)
																		{
																			fullname=userD.first_name+' '+userD.last_name;
																		}
																		tamplate = tamplate.replace('Username',fullname); 
																		tamplate = tamplate.replace('Content',html);
																		 tamplate = tamplate.replace('Download_label','You can also download your data at the link below:');
																	    mailer.send(
																		constants.confirmEmails.from,
																		//"zunedgkp@gmail.com",
																		 userD.email,
																		 title,
																		tamplate
																		).then(function() {
																		});

																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
																		};
																		
																		if(userD.user_firebase_id)
																		{
																			var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,notification_title,data);
																		}
																}).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
																//console.log(userD);
															    }).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
															}
												
											  }).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											  })
											
										}).catch(evError => {
											console.log('Upload S3 Error',evError)
											reject(evError)
										})
										
									//console.log(responseData);
								}).catch(evError => {
									console.log('Upload Response Error',evError);
									return apiResponse.ErrorResponse(res, err);
									reject(evError)
								})
							}
							//console.log(typeof(req.body.data.job.outputs));
							//var initiateForm=req.body.data.job.outputs[0];
							
						}
						else if(req.body.data.job.status=='failed')
						{
 							FileTaskModel.update({internal_status:'3'},{where: {initiate_id: initiateId}}).then(updatedData => {
                                 UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																	console.log(userD);

																EmailTamplateModel.findOne({where: { id: '5'} }).then((tamplate) => {
																	var html='';
																	    var title='Sorry to inform that your Scan failed.';
																		if(req.body.data)
																		{
																			let link1='';
																			let link2='';
																			
																			 html = "Your Collect Name: " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>" + link1+link2;
																			var title='Sorry to inform that your Scan failed.';
																		}
																		else
																		{
																			html = "Your uploading failed  : " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>";
																			var title='Sorry to inform that your Scan failed.';
																		}
																	     //html ="Your upload for scan " + collect.collect_name + " has failed. We couldn’t get the complete data at our end and hence your scan cannot be processed."+"<br><br>"+"<br>"+"";
																		 html ="Our system couldn’t successfully generate a 3D model from your scan "+'"'+collect.collect_name+'"'+". We are sorry and we request you to scan it again.<br>";
																		var tamplate=tamplate.content;

																		var fullname=userD.first_name
																		if(userD.last_name!='' && userD.last_name!=null)
																		{
																			fullname=userD.first_name+' '+userD.last_name;
																		}
																		
																		tamplate = tamplate.replace('Username',fullname); 
																		//tamplate = tamplate.replace('Your data has finished processing. You can view the the result by navigating to the scan within the Recon 3D app and clicking on Download Cloud Model button, or you can share it to another service or folder.',''); 
																		tamplate = tamplate.replace('Content',html);
																		tamplate = tamplate.replace('Download_label','');
																	    tamplate = tamplate.replace('Your Data is Ready',title);
																	    mailer.send(
																		constants.confirmEmails.from, 
																		//"zunedgkp@gmail.com",
																		userD.email,
																		 title,
																		tamplate
																		).then(function() {
																		});

																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
																		};
																		
																		if(userD.user_firebase_id)
																		{
																			var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,title,data);
																		}
																}).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
																//console.log(userD);
															    }).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})

							}).catch(err => {
									console.log(err);
									return apiResponse.ErrorResponse(res, err);
							})
						}
						return apiResponse.successResponseWithData(res,"Submitted.");
						}
						
					}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				    })
					
					
				 
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				})
				
				//console.log(req.body.data);

				}
				else
				{
					let jobUrl = req.body.job
					const replaced = jobUrl.replace('https://api.everypoint.io/v2/instances/development/', '');
					everypointProcess1.makeGetRequest(replaced).then(collectResponseData => {
						console.log('Collect Response data',collectResponseData.data.data.job)
						const collect = 
                    {
                        collect_id:collectResponseData.data.data.job.uri,
                        callback_data:JSON.stringify(collectResponseData.data.data),
                        status: collectResponseData.data.data.job.status
                    }
					
				CollectListModel.findOrCreate({where:{collect_id: collectResponseData.data.data.job.uri},defaults: collect}).then(async collectD => {
					
					FileTaskModel.findOne({where: {ep_collect_id: collectResponseData.data.data.job.uri}}).then(async collect => {
						if(collect)
						{
					    let initiateId=collect.initiate_id;
						if(collectResponseData.data.data.job.status=='complete')
						{

							


							
							var endPoint=EVP_BASE_URL+EVP_API_VERSION;
							
							var outputs=collectResponseData.data.data.job.outputs;
							let fileLength=outputs.length;
							var countA=1;
							var responseDataa=[];
							for(let i=0;i<outputs.length; i++){
								//console.log(endPoint+outputs[i]);
								result = await everypointProcess1.makeGetRequestNew(outputs[i]).then(async responseData => {
									console.log('Res Data',responseData.data);
									console.log('Asset name',responseData.data);
									let allData=Object.values(responseData.data.data);
									console.log('All data',allData[0]);
										let file=allData[0].url;
										let initiateId=collect.initiate_id;
										
										
										let name=allData[0].name;
										//let newName=name+'.'+allData[0].type;
										console.log('Puttttt Collect',collect.collect_name);
										console.log('Puttttt',allData[0]);
										//var new_name= collect.collect_name.replace('.', '_')+'.'+allData[0].type;
										//console.log('New Name',new_name);
										var putUrl=initiateId+'/3DObject/'+collect.collect_name.replace('.', '_')+'.'+allData[0].type;
										
										console.log('file Name',file);
										console.log('Put url Name',putUrl);
										put_from_url(file,bucketName,putUrl).then(async(s3DOFileUrl) => {
											//console.log(s3DOFileUrl);
											//responseData.push(s3DOFileUrl.Location);
											
											
											
											responseDataa.push(s3DOFileUrl.Location);
														console.log('Response Dataaaaaaaaaaaa',responseData);
											  var urlsS3D=JSON.stringify(responseDataa);


											  console.log('scccccccccccc',urlsS3D);
											  await FileTaskModel.update({s3_3d_url:urlsS3D,internal_status:'2',reupload:'1'},{where: {initiate_id: initiateId}}).then(updatedData => {
												//console.log(fileLength);
												//console.log(countA++);
											    let countD=countA++;
													if(fileLength==countD)
															{
																UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																	console.log(userD);
																EmailTamplateModel.findOne({where: { id: '3'} }).then((tamplate) => {
																	var html='';
																		
																			let link1='';
																			let link2='';
																			if(responseDataa[0])
																			{
																				link1="<a href="+responseDataa[0]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseDataa[0].match(/\.([^\./\?]+)($|\?)/)[0]+")</a><br>";
																			}
																			if(responseDataa[1])
																			{
																				//link2="<a href="+responseDataa[1]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud ("+responseDataa[1].match(/\.([^\./\?]+)($|\?)/)[1]+")</a><br>";
																			}
																			
																		    html = "Your Collect Name: " + collect.collect_name + "<br>"  + link1+link2;
																			var title='Recon-3D | Your 3D model is Ready';
																			var notification_title="Your "+ collect.collect_name +" scan is ready";

																		
																		
																		var tamplate=tamplate.content;

																		var fullname=userD.first_name
																		if(userD.last_name!='' && userD.last_name!=null)
																		{
																			fullname=userD.first_name+' '+userD.last_name;
																		}
																		tamplate = tamplate.replace('Username',fullname); 
																		tamplate = tamplate.replace('Content',html);
																		 tamplate = tamplate.replace('Download_label','You can also download your data at the link below:');
																	    mailer.send(
																		constants.confirmEmails.from,
																		//"zunedgkp@gmail.com",
																		 userD.email,
																		 title,
																		tamplate
																		).then(function() {
																			console.log('Email')
																		}).catch(err => {
																			console.log('Not send Email')
																		});

																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
																		};
																		
																		if(userD.user_firebase_id)
																		{
																			var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,notification_title,data);
																		}

																		rimraf("./uploads/3d-requests/"+initiateId, function () { console.log("Delete Folder done"); });
																		//rimraf("./uploads/3d-requests/"+initiateId, function () { console.log("Delete Folder done"); });
																		fs.unlinkSync('./uploads/eparls/output/'+initiateId+'/'+'metadata.xml');
																		fs.unlinkSync('./uploads/eparls/output/'+initiateId+'/'+'arkit_metadata.xml');
																		fs.unlinkSync('./uploads/eparls/output/'+initiateId+'/'+'arkit_lidar.bin');
																		
																		fs.unlinkSync('./uploads/epars/output/'+initiateId+'/'+'metadata.xml');
																		fs.unlinkSync('./uploads/epars/output/'+initiateId+'/'+'arkit_metadata.xml');
																		fs.unlinkSync('./uploads/epars/output/'+initiateId+'/'+'arkit_lidar.bin');
																		
																}).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																});
																//console.log(userD);
															    }).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})


															}
												
											  }).catch(err => {
												return apiResponse.ErrorResponse(res, err);
											  })
											
										}).catch(evError => {
											console.log('Upload S3 Error',evError)
											//reject(evError)
										})
										
									//console.log(responseData);
								}).catch(evError => {
									console.log('Upload Response Error',evError);
									return apiResponse.ErrorResponse(res, err);
									reject(evError)
								})

								//Increase Priority
								PreCompleteTaskModel.findAll({ where: { user_id: collect.user_id,complete_status:0 } }).then((dataTask) => {
									if(dataTask.length>0)
									{
										dataTask.forEach((element,index) => {
											let curPriority=element.process_priority+1;
											PreCompleteTaskModel.update({process_priority:curPriority},{where: {initiate_id: element.initiate_id}}).then(updatedData => {
											});
										});
	                                    
									}
								});

							    //Update response  time....
								PreCompleteTaskModel.update({complete_date:moment().format('YYYY-MM-DD HH:mm:ss'),complete_status:2,job_id:collect.ep_collect_id},{where: {complete_status: 1,initiate_id: initiateId}}).then(updatedData => {
								}).catch(err => {
										console.log(err);
										//return apiResponse.ErrorResponse(res, err);
								});
								//Processing Data...

								var url='http://54.236.108.107:8080/v1/chroneForTask';
								return everypointProcess1.makeRequestforChrone(url).then(jobData => {
		                            //return apiResponse.successResponseWithData(res,"Data Processed Successfully for Creating Model.")
		                        }).catch(successResponseError => {
		                          console.log('In catch Upload block error',successResponseError)
		                         // return apiResponse.ErrorResponse(res, successResponseError)
		                        })
							}
							//console.log(typeof(collectResponseData.data.data.job.outputs));
							//var initiateForm=collectResponseData.data.data.job.outputs[0];
							
						}
						else if(collectResponseData.data.data.job.status=='pending')
						{
							//Increase Priority
							/*PreCompleteTaskModel.findAll({ where: { user_id: collect.user_id,complete_status:0 } }).then((dataTask) => {
								if(dataTask.length>0)
								{
									dataTask.forEach((element,index) => {
										let curPriority=element.process_priority+1;
										FileTaskModel.update({process_priority:curPriority},{where: {initiate_id: element.initiate_id}}).then(updatedData => {
										});
									});
								}
							});*/

							PreCompleteTaskModel.update({job_id:collect.ep_collect_id},{where: {complete_status: 1,initiate_id: initiateId}}).then(updatedData => {
							}).catch(err => {
										console.log(err);
										//return apiResponse.ErrorResponse(res, err);
							});

                            FileTaskModel.update({internal_status:'4'},{where: {initiate_id: initiateId}}).then(updatedData => {
                                return apiResponse.successResponseWithData(res,"Submitted.");
                            }).catch(err => {
									console.log(err);
								//return apiResponse.ErrorResponse(res, err);
							})
                            
						}
						else if(collectResponseData.data.data.job.status=='processing')
						{
							//Increase Priority
							/*PreCompleteTaskModel.findAll({ where: { user_id: collect.user_id,complete_status:0 } }).then((dataTask) => {
								if(dataTask.length>0)
								{
									dataTask.forEach((element,index) => {
										let curPriority=element.process_priority+1;
										FileTaskModel.update({process_priority:curPriority},{where: {initiate_id: element.initiate_id}}).then(updatedData => {
										});
									});
								}
							});*/

							PreCompleteTaskModel.update({job_id:collect.ep_collect_id},{where: {complete_status: 1,initiate_id: initiateId}}).then(updatedData => {
							}).catch(err => {
										console.log(err);
										//return apiResponse.ErrorResponse(res, err);
							});
                             
                             FileTaskModel.update({internal_status:'1'},{where: {initiate_id: initiateId}}).then(updatedData => {
                                return apiResponse.successResponseWithData(res,"Submitted.");
                            }).catch(err => {
									console.log(err);
								//return apiResponse.ErrorResponse(res, err);
							})
						}
						else if(collectResponseData.data.data.job.status=='failed')
						{

 							FileTaskModel.update({internal_status:'3'},{where: {initiate_id: initiateId}}).then(updatedData => {
                                 UserModel.findOne({where: {id: collect.user_id}}).then(userD => {
																	console.log(userD);

																EmailTamplateModel.findOne({where: { id: '5'} }).then((tamplate) => {
																	var html='';
																	    var title='Sorry to inform that your Scan failed.';
																		if(collectResponseData.data.data)
																		{
																			let link1='';
																			let link2='';
																			
																			 html = "Your Collect Name: " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>" + link1+link2;
																			var title='Sorry to inform that your Scan failed.';
																		}
																		else
																		{
																			html = "Your uploading failed  : " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>";
																			var title='Sorry to inform that your Scan failed.';
																		}
																	     //html ="Your upload for scan " + collect.collect_name + " has failed. We couldn’t get the complete data at our end and hence your scan cannot be processed."+"<br><br>"+"<br>"+"";
																		 html ="Our system couldn’t successfully generate a 3D model from your scan "+'"'+collect.collect_name+'"'+". We request you to try scanning again.<br>";
																		var tamplate=tamplate.content;

																		var fullname=userD.first_name
																		if(userD.last_name!='' && userD.last_name!=null)
																		{
																			fullname=userD.first_name+' '+userD.last_name;
																		}
																		
																		tamplate = tamplate.replace('Username',fullname); 
																		//tamplate = tamplate.replace('Your data has finished processing. You can view the the result by navigating to the scan within the Recon 3D app and clicking on Download Cloud Model button, or you can share it to another service or folder.',''); 
																		tamplate = tamplate.replace('Content',html);
																		tamplate = tamplate.replace('Download_label','');
																	    tamplate = tamplate.replace('Your Data is Ready',title);
																	    mailer.send(
																		constants.confirmEmails.from, 
																		userD.email,
																		//"zunedgkp@gmail.com",
																		
																		 title,
																		tamplate
																		).then(function() {
																		});

																		var data={
																		initiate_id:collect.initiate_id,
																		collect_id:collect.ep_collect_id,
																		collect_name:collect.collect_name,
																		};
																		
																		if(userD.user_firebase_id)
																		{
																			//var result = notificationUtility.sentNotificationSingle(userD.user_firebase_id,title,data);
																		}
																}).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})
																//console.log(userD);
															    }).catch(err => {
																		console.log(err);
																		return apiResponse.ErrorResponse(res, err);
																})

							}).catch(err => {
									console.log(err);
									return apiResponse.ErrorResponse(res, err);
							});

							//Increase Priority
							PreCompleteTaskModel.findAll({ where: { user_id: collect.user_id,complete_status:0} }).then((dataTask) => {
								if(dataTask.length>0)
								{
									dataTask.forEach((element,index) => {
										let curPriority=element.process_priority+1;
										PreCompleteTaskModel.update({process_priority:curPriority},{where: {initiate_id: element.initiate_id}}).then(updatedData => {
										}).catch(err => {
												console.log(err);
												//return apiResponse.ErrorResponse(res, err);
										});
									});
                                    
								}
							});
							//Update response  time....
							PreCompleteTaskModel.update({complete_date:moment().format('YYYY-MM-DD HH:mm:ss'),complete_status:3,job_id:collect.ep_collect_id},{where: {complete_status: 1,initiate_id: initiateId}}).then(updatedData => {
							}).catch(err => {
									console.log(err);
									//return apiResponse.ErrorResponse(res, err);
							});

						   //Processing Data...
							var url='http://54.236.108.107:8080/v1/chroneForTask';
							return everypointProcess1.makeRequestforChrone(url).then(jobData => {
	                            //return apiResponse.successResponseWithData(res,"Data Processed Successfully for Creating Model.")
	                        }).catch(successResponseError => {
	                          console.log('In catch Upload block error');
	                         // return apiResponse.ErrorResponse(res, successResponseError)
	                        }).catch(err => {
									console.log(err);
									//return apiResponse.ErrorResponse(res, err);
							});
						}


						
						}
						
					}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				    })

				    return apiResponse.successResponseWithDataInstant(res,"Submitted.");
					
					
				 
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				})
					}).catch(collectDetailError => {

					})
				}
		}
		catch (err)
		{
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
		
		
		}
]

exports.notification = [
	//auth,	
	function (req, res)
	{
		try{
			// This registration token comes from the client FCM SDKs.
			
				//var serverKey = 'AAAAo8GrDhk:APA91bGQuVDrAyQERMWwpbPJKWnb78X76LWTXb8dJz4pT12S25RAH6CcbyFtgcfsR1_B9b0LdT0MwUQs68beLSKQrPa34e6FDrpk42n_AtxXqXx_lrn0GYp8reZ6MBK3sIl902a8W2qR'; //put your server key here
				//var fcm = new FCM(serverKey);
				var queryTask = {initiate_id:'89117490'};
				FileTaskModel.findOne({where: queryTask}).then(element => {
					var firebase_id=[];
					 firebase_id.push('decaqkpkhk8whoNuFrse4j:APA91bFBO5irYgvkGAthfVN2p9xI46Ikc9A6ds9wHcMmnpmN1UEjBo4bdramfcpA4ZfX4zg2pOC-49J8G-3qxNRgb4ivDHRk9xl5DqlIWIXdr9EY8Ve0ibNP6TdAFtSwOaBs8OibrSHc');
					var title='Reupload Collection';
					var data={
					initiate_id:element.initiate_id,
					collect_id:element.ep_collect_id,
					collect_name:element.collect_name,

					};
					var result = notificationUtility.sentNotificationMultiple(firebase_id,title,data);
					console.log(result);
			    }).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				});
				
		}
		catch (err)
		{
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	}
];







