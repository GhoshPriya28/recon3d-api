const { BASE_URL, EVP_API_VERSION, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE, FCM_KEY } = process.env;
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const everypointProcess = require("../helpers/everypointProcess");
const join = require('path').join;
var FormData = require('form-data');
const fs = require('fs');
const utility = require("../helpers/utility");
const db = require("../models");
const { FileTaskModel: FileTaskModel, SubFileTaskModel: SubFileTaskModel, ChunkModel: ChunkModel } = db;

exports.completeEveryPointTask1 = [


  async function (req, res) {
    try {
      const errors = validationResult(req);

      const initiateId = req.body.initiateId;
      const userId = req.body.userId;
      console.log('Initiate', initiateId)

      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      }
      else {
        FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async uploadDetails => {
          if (uploadDetails.file_type == 'video') {
            console.log('Video Url', uploadDetails.s3_file_url);
            SubFileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(subTaskDetails => {
              console.log('Merge File    ', subTaskDetails.merge_file);
              // let uploadUrlData = JSON.parse(uploadDetails.s3_file_url)
              let uploadUrlData = [];
              //https://api.recon-3d.com/uploads/3d-requests/97258885/merges/EveryPointSession_2022_04_30_21_24_29.eparls
              uploadUrlData.push(BASE_URL + "3d-requests/" + initiateId + "/merges/" + subTaskDetails.merge_file);
              //uploadUrlData.push("./uploads/3d-requests/"+initiateId+"/merges/"+subTaskDetails.merge_file);
              //uploadUrlData.push('uploads/3d-requests/25710742/merges/EveryPointSession_2022_04_30_19_22_56.eparls');

              console.log('eprls   ', uploadUrlData);
              processToEveryPoint(uploadUrlData, 'ar-lidar-sessions', 'video').then(processingData => {
                var jobRequestBody = '';
                if (req.body.scanSetting.target_distance_in_meters && req.body.scanSetting.target_distance_in_meters != '' && req.body.scanSetting.target_distance_in_meters != 0) {
                  console.log('HHH');
                  jobRequestBody = {
                    "function": "/functions/pixels-to-point-cloud",
                    "inputs": processingData,
                    "settings": {
                      "output_file_types": ["e57"],
                      "depth_map_dimension": req.body.scanSetting.depth_map_dimension ? req.body.scanSetting.depth_map_dimension : '',
                      "point_spacing_in_meters": req.body.scanSetting.point_spacing_in_meters ? req.body.scanSetting.point_spacing_in_meters : '',
                      "target_distance_in_meters": req.body.scanSetting.target_distance_in_meters ? req.body.scanSetting.target_distance_in_meters : '',
                      "ignore_failed_target_detection": req.body.scanSetting.ignore_failed_target_detection ? req.body.scanSetting.ignore_failed_target_detection : '',
                    }
                  }
                }
                else {
                  console.log('HHH');
                  jobRequestBody = {
                    "function": "/functions/pixels-to-point-cloud",
                    "inputs": processingData,
                    "settings": {
                      "output_file_types": ["e57"],
                      "depth_map_dimension": req.body.scanSetting.depth_map_dimension ? req.body.scanSetting.depth_map_dimension : '',
                      "point_spacing_in_meters": req.body.scanSetting.point_spacing_in_meters ? req.body.scanSetting.point_spacing_in_meters : '',
                      //"target_distance_in_meters":req.body.scanSetting.target_distance_in_meters?req.body.scanSetting.target_distance_in_meters:'',
                      // "ignore_failed_target_detection":req.body.scanSetting.ignore_failed_target_detection?req.body.scanSetting.ignore_failed_target_detection:'',
                    }
                  }
                }

                everypointProcess.makePostRequest('jobs', jobRequestBody).then(jobData => {

                  console.log('Befor Update', jobData);
                  if (jobData.success === true) {
                    console.log('After Success Update', jobData);
                    let updateData = {
                      ep_collect_id: jobData.data.job,
                      collect_name: req.body.collect_name ? req.body.collect_name : '',
                      src_type: (req.body.dataSetType == 1) ? 'EVERYPOINT' : 'EVERYPOINTDATASET',

                      //total_assets : req.body.total_files?req.body.total_files:'',

                      //collect_notes : req.body.collect_notes?req.body.collect_notes:""
                    }
                    //console.log(updateData);
                    FileTaskModel.update(updateData, { where: { initiate_id: initiateId } }).then(updatedData => {
                      console.log('Job Creation Details : ', jobData.data.job)
                      console.log('Job Updated Data', updatedData)
                      // return apiResponse.successResponseWithData(res,"Task Created Successfuly.");
                      return apiResponse.successResponseWithData(res, "Uploaded Job Details", jobData.data.job)
                    }).catch(processingDataError => {
                      console.log('Processing Files Error', processingDataError)
                      return apiResponse.ErrorResponse(res, processingDataError)
                    });


                  }
                  else {
                    return apiResponse.notFoundResponse(res, jobData.message)
                  }

                }).catch(evJobError => {
                  console.log('Job Creation error : ', jobData.data.job)
                  return apiResponse.ErrorResponse(res, evJobError)
                })
              }).catch(processingDataError => {
                console.log('Processing Files Error', processingDataError)
                return apiResponse.ErrorResponse(res, processingDataError)
              })

              return apiResponse.successResponseWithData(res, "Task Created Successfuly.")
            });

          }
          else {
            console.log('File Type Error', uploadDetails.file_type)
            return apiResponse.ErrorResponse(res, 'File Type Not Defined for this initiate id.')
          }
        }
        )
      }
    }
    catch (err) {
      console.log('In catch block error', err)
      return apiResponse.ErrorResponse(res, err)
    }
  }
]

async function processToEveryPoint(fileData, apiEndPoint, responsePoint) {
  let count = 1;
  var proecssData = []
  let result;
  console.log('Req Typeeee', responsePoint);

  console.log('File Data', fileData);


  for (let i = 0; i < fileData.length; i++) {
    let initiateForm = new FormData()
    //initiateForm.append('file_url', 'https://recon-assets.s3.us-east-2.amazonaws.com/EveryPointSession_2022_04_28_16_28_54.eparls')
    initiateForm.append('file_url', fileData[i]);
    console.log(initiateForm);
    console.log('apo end', apiEndPoint);
    console.log('Formm', initiateForm);
    result = await everypointProcess.makeMultipartRequest(apiEndPoint, initiateForm).then(async responseData => {
      console.log('Upload Response Data', responseData)
      if (responseData.success === true) {
        // console.log("Resolve==>",Promise.resolve(responseData.data.image))
        // if(responsePoint=='image')
        // {
        //   proecssData.push(responseData.data.image)
        // }
        // else
        // {
        let arrValues = Object.values(responseData.data);
        console.log('Upload Value', arrValues[0])
        proecssData.push(arrValues[0])
        // }

        console.log("procss", proecssData)
        // return Promise.all(proecssData)
        if (fileData.length === count) {
          console.log("success", proecssData)
          const l = await Promise.all(proecssData)
          console.log("promisefullfill", l)
          return l
          // return "Hello"
        }
        count++;


      }
      else {
        console.log('Upload Response From Everypoint', responseData.message)
        reject(responseData.message)
      }
    }).catch(evError => {
      console.log('Upload Response Error', evError)
      reject(evError)
    })
  }

  return result

  console.log("result===>", proecssData)

}


exports.completeEveryPointTask = [
  async function (req, res) {
    try {
      const errors = validationResult(req);
      const initiateId = req.body.initiateId;
      const userId = req.body.userId;

      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      }
      else {
        FileTaskModel.findOne({ where: { initiate_id: initiateId } }).then(async uploadDetails => {
          let folderName = 'uploads/3d-requests/' + uploadDetails.initiate_id;
          let formData = new FormData();
          formData.append('file_name', 'new_collect_video.eparls');
          formData.append('total_parts', uploadDetails.chunks);
          everypointProcess.makeMultipartRequest('ar-lidar-sessions/start-multipart-upload', formData).then(responseData => {
            console.log('Upload Response Data', responseData.data)
            let arrValues = Object.values(responseData.data);
            let lidarSessionId = arrValues[0];
            uploadChunks(lidarSessionId, initiateId, folderName).then(uploadedChunkData => {
              console.log(uploadedChunkData);

              everypointProcess.makeGetRequestNew(lidarSessionId).then(videoResponseData => {
                console.log('Video Get Response', videoResponseData)
                let arrValues = Object.values(responseData.data);


                if (req.body.scanSetting.target_distance_in_meters && req.body.scanSetting.target_distance_in_meters != '' && req.body.scanSetting.target_distance_in_meters != 0) {
                  console.log('HHH');
                  jobRequestBody = {
                    "function": "/functions/pixels-to-point-cloud",
                    "inputs": [arrValues[0]],
                    "settings": {
                      "output_file_types": ["e57"],
                      "depth_map_dimension": req.body.scanSetting.depth_map_dimension ? req.body.scanSetting.depth_map_dimension : '',
                      "point_spacing_in_meters": req.body.scanSetting.point_spacing_in_meters ? req.body.scanSetting.point_spacing_in_meters : '',
                      "target_distance_in_meters": req.body.scanSetting.target_distance_in_meters ? req.body.scanSetting.target_distance_in_meters : '',
                      "ignore_failed_target_detection": req.body.scanSetting.ignore_failed_target_detection ? req.body.scanSetting.ignore_failed_target_detection : '',
                    }
                  }
                }
                else {
                  console.log('HHH');
                  jobRequestBody = {
                    "function": "/functions/pixels-to-point-cloud",
                    "inputs": [arrValues[0]],
                    "settings": {
                      "output_file_types": ["e57"],
                      "depth_map_dimension": req.body.scanSetting.depth_map_dimension ? req.body.scanSetting.depth_map_dimension : '',
                      "point_spacing_in_meters": req.body.scanSetting.point_spacing_in_meters ? req.body.scanSetting.point_spacing_in_meters : '',
                      //"target_distance_in_meters":req.body.scanSetting.target_distance_in_meters?req.body.scanSetting.target_distance_in_meters:'',
                      // "ignore_failed_target_detection":req.body.scanSetting.ignore_failed_target_detection?req.body.scanSetting.ignore_failed_target_detection:'',
                    }
                  }
                }



                everypointProcess.makePostRequest('jobs', jobRequestBody).then(jobData => {
                  if (jobData.success === true) {
                    console.log('After Success Update', jobData);
                    let updateData = {
                      ep_collect_id: jobData.data.job,
                      collect_name: req.body.collect_name ? req.body.collect_name : '',
                      src_type: (req.body.dataSetType == 1) ? 'EVERYPOINT' : 'EVERYPOINTDATASET',

                      //total_assets : req.body.total_files?req.body.total_files:'',

                      //collect_notes : req.body.collect_notes?req.body.collect_notes:""
                    }
                    //console.log(updateData);
                    FileTaskModel.update(updateData, { where: { initiate_id: initiateId } }).then(updatedData => {
                      console.log('Job Creation Details : ', jobData.data.job)
                      console.log('Job Updated Data', updatedData)
                      // return apiResponse.successResponseWithData(res,"Task Created Successfuly.");
                      return apiResponse.successResponseWithData(res, "Uploaded Job Details", jobData.data.job)
                    }).catch(err => {
                      console.log('Processing Files Error', err)
                      // return apiResponse.ErrorResponse(res, processingDataError)
                    });


                  }
                  else {
                    return apiResponse.notFoundResponse(res, jobData.message)
                  }


                  //console.log('Uploaded Job Details',jobData.data.job)
                  //return apiResponse.successResponseWithData(res,"Uploaded Job Details", jobData.data.job); 
                }).catch(evJobError => {
                  console.log('Job Creation Error : ', evJobError)
                })
              }).catch(videoError => {
                console.log('Get Video Details Error : ', videoError)
              })
            }).catch(chunkError => {
              console.log('Chunk Upload Error : ', chunkError)
            })
          }).catch(evError => {

            console.log('Start Upload Response Error', evError)
          })
          return apiResponse.successResponseWithData(res, "Task Created Successfuly.")
        });
      }
    }
    catch (err) {
      console.log('In catch block error', err)
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

async function uploadChunks(apiEndPoint, initiateId, folderName) {
  const filePath = "./uploads/3d-requests/" + initiateId + '/';
  const allChunkFiles = fs.readdirSync(filePath);
  var excludeMerges = utility.excludeArray(allChunkFiles, 'merges');
  var proecssData = []
  let count = 1;
  const chunkFiles = excludeMerges.sort(utility.sortArray);

  console.log('sorted Data', chunkFiles)
  console.log('lenghthhh', chunkFiles.length);
  for (let i = 0; i < chunkFiles.length; i++) {

    console.log('Auto Inc', i);

    console.log('file   ggg', filePath + chunkFiles[i]);
    let formData = new FormData();
    //var fileIndex = i;
    let c = i + 1;
    formData.append('part', c.toString());
    formData.append('file', fs.createReadStream(filePath + chunkFiles[i]));
    await everypointProcess.makeMultipartRequestNew(apiEndPoint, formData).then(async responseData => {
      console.log('Resssssssssss', responseData, i.toString());
      if (responseData.success === true) {
        const partData =
        {
          initiate_id: initiateId,
          chunk_file: chunkFiles[i],
          chunk_index: i,
          status: 1,
        }
        ChunkModel.create(partData).then(async list => {
        });
        proecssData.push(responseData)
        if (excludeMerges.length === count) {
          console.log("success", proecssData)
          const l = await Promise.all(proecssData)
          console.log("promisefullfill", l)
          return l
          // return "Hello"
        }
      }
      else {
        const partData =
        {
          initiate_id: initiateId,
          chunk_file: chunkFiles[i],
          chunk_index: i,
          status: 0,
        }
        ChunkModel.create(partData).then(async list => {
        });
      }

      count++;
    });
  }
  //return await Promise.all(


  /* chunkFiles.map((element,index) => {
     console.log('File Path Index',index+1)
     let formData = new FormData();
     var fileIndex = index+1
     formData.append('part', fileIndex.toString());
     formData.append('file', fs.createReadStream(filePath+element));
     everypointProcess.makeMultipartRequestNew(apiEndPoint,formData).then(responseData => {
       console.log('Chunk Upload Response',responseData)
     }).catch(uploadError => {
       console.log('Upload Response Error',uploadError)
     })
   })
 )*/
}

// update prioririty 
exports.priorityUpdate = [
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      } else {
        var initiateId = { initiate_id: req.body.initiate_id }
        var priority = { priority: req.body.priority }
        FileTaskModel.findOne({ where: initiateId }).then(async data => {
          if (data) {
            await FileTaskModel.update(priority, { where: initiateId }).then(prioritydata => {
              return apiResponse.successResponseWithData(res, "Updated Successfully.")
            });
          }
          else {
            return apiResponse.notFoundResponse(res, "Invalid Initiate Id.");
          }
        });
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error)
    }
  }
]

