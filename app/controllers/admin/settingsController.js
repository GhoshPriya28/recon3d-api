const db = require("../../models");
const { BASE_URL, ADMIN_BASE_URL, PORTAL_BASE_URL, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
//const UserModel = db.UserModel;
const { UserModel: UserModel, FileTaskModel: FileTaskModel, EmailTamplateModel: EmailTamplateModel, TermsModel: TermsModel, PrivacyPolicyModel: PrivacyPolicyModel, EmailsupportModel: EmailsupportModel, FaqsModel: FaqsModel, TutorialsModel: TutorialsModel,PreCompleteTaskModel:PreCompleteTaskModel } = db;
const Op = db.Sequelize.Op;
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../../helpers/apiResponse");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const bcrypt = require("bcrypt");
const path = require('url');

const flash = require('connect-flash');
const utility = require("../../helpers/utility");
const notificationUtility = require("../../helpers/pushNotification");
var moment = require('moment');
var ffmpeg = require('ffmpeg');
var configFile = require('../../config/configFile');
var imageBasePath = configFile.getBaseUrl();
const { constants } = require("../../helpers/constants");
const mailer = require("../../helpers/mailer");
var Sequelize = db.Sequelize.Sequelize;
const fs = require('fs');
var rimraf = require("rimraf");
const everypointProcess = require("../../helpers/everypointProcess2");
const axios = require("axios").create({ baseURL: EVP_BASE_URL, headers: { 'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ==' } });





exports.settings = [
    async function (req, res) {
        try {
      FileTaskModel.findOne({ where: { initiate_id: req.body.initiate_id } }).then(async details => {
        console.log("details", details);
        if (details) {
          let data = JSON.parse(details.task_request) || {};
          console.log("details.task_request", details.task_request);
          console.log("data", req.body);


          

          if (req.body.scan_density) {

            if (req.body.scan_density) {
              data.scanSetting.point_spacing_in_meters = req.body.scan_density/1000
            }
            if (req.body.depth) {
              data.scanSetting.target_distance_in_meters = req.body.depth
            }
            if (req.body.target) {
              data.scanSetting.depth_map_maximum_depth = req.body.target
            }
          }
          var updateTask = { task_request: JSON.stringify(data),internal_status:4 };
          let process_priority = 100;

          
          const userId = details.user_id;
          
          //const getUser = await PreCompleteTaskModel.findAll( {where: { user_id: userId }} );
          const getUser = await PreCompleteTaskModel.findAll( {
              where: { user_id:userId }});
          if (getUser.length) {
              process_priority = 100
          }

          const collect =
          {
              initiate_id:  details.initiate_id,
              user_id: userId,
              payload: data,
              process_priority: 100,
              complete_status: 1,
              reprocess:1
          }

          

          PreCompleteTaskModel.findOrCreate({where:{initiate_id: details.initiate_id,complete_status:0},defaults: collect}).then(async initiateDetail => {
            FileTaskModel.update(updateTask, { where: { initiate_id: details.initiate_id } }).then(updateSettings => {
              
              var url='http://54.236.108.107:8080/api/v1/completeEveryPointTaskChrone/';
              //console.log('initiateDetail',initiateDetail[0].payload);
              const collect =
              {
                  data: JSON.stringify(initiateDetail[0].payload)
              }
              
              return everypointProcess.makeRequestforChrone(url,collect).then(jobData => {
                PreCompleteTaskModel.update({ complete_status: 1 }, { where: { initiate_id: details.initiate_id } }).then(updateTask => {
                    console.log("updateTask",updateTask);
                });
                //return apiResponse.successResponseWithData(res,"Data Processed Successfully for Creating Model.")
                }).catch(successResponseError => {
                  console.log('In catch Upload block error',successResponseError)
                // return apiResponse.ErrorResponse(res, successResponseError)
                })
            })
          });

          //Increase Priority
          /*PreCompleteTaskModel.findAll({ where: { user_id: userId,complete_status:0 } }).then((dataTask) => {
            if(dataTask.length>0)
            {
              dataTask.forEach((element,index) => {
                let curPriority=element.process_priority+1;
                PreCompleteTaskModel.update({process_priority:curPriority},{where: {initiate_id: element.initiate_id}}).then(updatedData => {
                });
              });
            }
          });*/

          return apiResponse.successResponseWithDataInstant(res,"Task request updated successfully.");
          
         

        }
        else {
          return apiResponse.notFoundResponse(res, "details Not Found");
        }
      })

    } catch (error) {
      return apiResponse.ErrorResponse(res, error)
    }
  }
]





