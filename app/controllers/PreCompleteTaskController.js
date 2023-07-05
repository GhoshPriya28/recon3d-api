const { BASE_URL, EVP_API_VERSION, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE, FCM_KEY } = process.env;
const { body, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const join = require('path').join;
var FormData = require('form-data');
const fs = require('fs');
const db = require("../models");
const { initiateDetail } = require("./FileController");
const { PreCompleteTaskModel: PreCompleteTaskModel, FileTaskModel: FileTaskModel } = db;
const utility = require("../helpers/utility");
const everypointProcess = require("../helpers/everypointProcess2");


exports.preCompleteTask = [
    async function (req, res) {
        try {
            var process_priority = 90;
            if(req.body.userId==163 || req.body.userId==164 || req.body.userId==1389)
            {
                 process_priority = 100;
            }
            
            const userId = req.body.userId;
           
            //const getUser = await PreCompleteTaskModel.findAll( {where: { user_id: userId }} );
            var job_length=0;
            const getUser = await PreCompleteTaskModel.findAll( {
                where: { user_id:req.body.userId, complete_status: 0}});
            if (getUser.length) {
                process_priority = process_priority - getUser.length;
                job_length=getUser.length;
            }
            const collect =
            {
                initiate_id: req.body.initiateId,
                user_id: userId,
                payload: req.body,
                process_priority: process_priority,
                complete_status: 0
            }

            var task_request=JSON.stringify(req.body);

            let updateDataStatus = {internal_status:'4',collect_name:req.body.collect_name,task_request:task_request,priority:process_priority}
            console.log(updateDataStatus);
            FileTaskModel.update(updateDataStatus,{where: {initiate_id: req.body.initiateId}}).then(updatedData => {
                
            }).catch(processingDataError => {          
            console.log('Processing Files Error',processingDataError)
            });

           // process.exit();


            PreCompleteTaskModel.findOrCreate({where:{initiate_id: req.body.initiateId},defaults: collect}).then(async initiateDetail => {

           // PreCompleteTaskModel.create(collect).then(async initiateDetail => {
                //console.log("initiateDetail", initiateDetail);


                
                if (initiateDetail) {

                    PreCompleteTaskModel.findAll({ where: { complete_status: 0 } }).then((data) => {
                        if(data.length==1)
                        {
                          var url='http://54.236.108.107:8080/api/v1/chroneForTask';
                            return everypointProcess.makeRequestforChrone(url).then(jobData => {
                                //return apiResponse.successResponseWithData(res,"Data Processed Successfully for Creating Model.")
                            }).catch(successResponseError => {
                              console.log('In catch Upload block error',successResponseError)
                             // return apiResponse.ErrorResponse(res, successResponseError)
                            })
                        }
                    });
                    
                    var queryTask = { complete_status: 0 };
                    /*await PreCompleteTaskModel.update({ complete_status: 1 }, { where: { initiate_id: req.body.initiate_id } }).then(updateTask => {
                                console.log("updateTask",updateTask);
                    });*/
                    const getData = await PreCompleteTaskModel.findAll({ where: queryTask, limit: 5, order: [['process_priority', 'DESC']] });
                    //console.log("getData", getData);
                    // if (getData === 5) {
                        for (let getData = 0; getData.length < 5; getData++) {
                            /*await PreCompleteTaskModel.update({ complete_status: 1 }, { where: { initiate_id: req.body.initiate_id } }).then(updateTask => {
                                console.log("updateTask",updateTask);
                            });*/
                        }
                    // }
                    return apiResponse.successResponseWithData(res, "Data Processed")
                }
            })
        }
        catch (err) {
            console.log(err)
            return apiResponse.ErrorResponse(res, err);
        }
    }]

    exports.chroneForTask = [
        async function (req, res) {
            try {
                //Getting Pending task..
                var url='http://54.236.108.107:8080/api/v1/completeEveryPointTaskChrone/';
                const getPendingtask = await PreCompleteTaskModel.findAll( { where: { complete_status:0 },limit : 1,order: [['process_priority', 'DESC']]});
                if(getPendingtask.length>0)
                {
                    await getPendingtask.forEach(function(element) {
                      
                       const collect =
                       {
                           data: element.payload
                       }
                       //console.log(collect);
                        return everypointProcess.makeRequestforChrone(url,collect).then(jobData => {
                            PreCompleteTaskModel.update({ complete_status: 1 }, { where: { initiate_id: element.initiate_id } }).then(updateTask => {
                                console.log("updateTask",updateTask);
                            });
                           // return apiResponse.successResponseWithData(res,"Data Processed Successfully for Creating Model.")
                        }).catch(successResponseError => {
                          console.log('In catch Upload block error',successResponseError)
                         // return apiResponse.ErrorResponse(res, successResponseError)
                        })
                    });
                    //return apiResponse.successResponseWithData(res,"Data Processed Successfully for Creating Model.")
                    
                }
                else
                {
                    //return apiResponse.successResponseWithData(res,"Data not available for process.")
                }
            }
            catch (err) {
                console.log(err)
                //return apiResponse.ErrorResponse(res, err);
            }
    }]