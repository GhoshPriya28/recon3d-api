const db = require("../../models");
const { BASE_URL, ADMIN_BASE_URL, PORTAL_BASE_URL, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
//const UserModel = db.UserModel;
const { UserModel: UserModel, DeviceDetailModel: DeviceDetailModel, UserNotificationModel: UserNotificationModel, NotificationDetailModel: NotificationDetailModel, FileTaskModel: FileTaskModel, EmailTamplateModel: EmailTamplateModel, TermsModel: TermsModel, PrivacyPolicyModel: PrivacyPolicyModel, EmailsupportModel: EmailsupportModel, FaqsModel: FaqsModel, TutorialsModel: TutorialsModel } = db;
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
// const { where } = require("sequelize/types");
const axios = require("axios").create({ baseURL: EVP_BASE_URL, headers: { 'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ==' } });
// const { sendEmail } = require("../../helpers/nodemailer")
const timeStamp = require("../../helpers/timestamp.js")
exports.userlistdataNotification = [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/web/admin/login');
    }
    let search = req.body['search[value]'];
    var searchV = '';
    if (search) {
      searchV = "where first_name like '%" + search + "%' || last_name like '%" + search + "%' || email like '%" + search + "%'";
    }
    var ser = '';
    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    var dd = '';
    let offset = parseInt(req.body.start);
    await UserModel.findAll().then(data => {
      data.forEach(element => {
        rowCount++;
      });
    });
    field = req.body['order[0][column]'];
    fieldName = req.body["columns[" + field + "][data]"];
    var user_sql="SELECT *,(select count(*) from file_tasks where user_id=app_users.id) as total_upload,(select user_id from users_notifications where user_id=app_users.id and notification_id=(SELECT id FROM `notification_details` ORDER by id desc LIMIT 1 OFFSET 0 )) as sent,(select createdAt from users_notifications where user_id=app_users.id and notification_id=(SELECT id FROM `notification_details` ORDER by id desc LIMIT 1 OFFSET 0 )) as sent_time FROM `app_users` " + searchV + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    //var user_sql = "SELECT *,(select count(*) from file_tasks where user_id=app_users.id) as total_upload FROM `app_users` " + searchV + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    var user_sqlCount = "select * from app_users " + searchV;
    UserModel.sequelize.query(user_sql).then((result) => {
      UserModel.sequelize.query(user_sqlCount).then((resultC) => {
        let Tcount = resultC[0].length;
        let UserListAr = result[0].map((r) => {
          FileTaskModel.count({ where: { user_id: r.id } }).then(dataC => {
            dd = dataC;
          });
          var checkbox = '<td><input type="checkbox" id="checkbox" class="user_ids" value=' + r.id + ' name="user_ids"></td>'
          //let send=false
          var send = '<td><div class="badge badge-danger">Not Sent</div></td>';
          if(r.sent)
          {
              send = '<td><div class="badge badge-success">Sent</div></td>';
          }
          var invoiceData =
          {
            id: checkbox,
            first_name: r.first_name,
            last_name: r.last_name,

            name: r.first_name + ' ' + r.last_name,
            email: r.email,
            orgnization_name: send,
            total_upload: r.total_upload,
            // sent_time: r.sent_time
            sent_time: (r.sent_time)?timeStamp.getFormatTime(r.sent_time):''

          }
          
          return invoiceData;
        });
        let fdata = {
          "draw": draw,
          "recordsTotal": Tcount,
          "recordsFiltered": Tcount,
          "data": UserListAr
        };
        res.send(fdata);
      });
    });
  }
]
exports.UserlistNotification = [
  (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/web/admin/login');
    }
    UserModel.findAll().then(data => {
      res.render('userlistNotification', { posts: req.session.name, data: data });
    });
  }
]
exports.send_notificationOld =
  [
    async (req, res) => {
      if (req.session.name) {
        var userId = { id: req.body.user_ids };
        var firebaseIds = []
        UserModel.findAll({ where: userId }).then(user => {
          if (user) {
            var user_id = { user_id: req.body.user_ids }
            DeviceDetailModel.findAll({ where: user_id }).then(async userDetail => {
              if (userDetail) {
                userDetail.forEach(function (value, index) {
                  if (value.user_firebase_id) {
                    firebaseIds.push(value.user_firebase_id);
                  }
                });
                var title = req.body.title;
                var comment = req.body.comment;
                var data = {
                  title: title,
                  comment: comment
                }
                const returnData = await notificationUtility.sentNotificationMultiple(firebaseIds, title, data);
                console.log(returnData);
                const notification = NotificationDetailModel.create({ notification: req.body.comment, title: req.body.title }).then(notifications => {
                  if (notifications) {
                    const notificationData = UserNotificationModel.create({ user_id: req.body.user_ids, user_device_id: req.body.user_device_id, notification_id: notifications.id, status: req.body.status })
                    return apiResponse.successResponseWithData(res, "Created Successfully.", notificationData);
                  }
                  return apiResponse.successResponseWithData(res, "Created Successfully.", notification);
                })
              }
              else {
                return apiResponse.notFoundResponse(res, "Notification Unsuccessfull");
              }
            })
          }
          else {
            return apiResponse.notFoundResponse(res, "User Id not found.");
          }
        })
      } else {
        res.render('login');
      }
    }
  ]

exports.send_notification =
  [
    async (req, res) => {
      if (req.session.name) {
        var userId = { id: req.body.user_ids };
        var firebaseIds = []
        var title = req.body.title;
        var comment = req.body.comment;
        var data = {
          title: title,
          comment: comment
        }
        UserModel.findAll({ where: userId }).then(user => {
          if (user) {
            var user_id = { user_id: req.body.user_ids }
            DeviceDetailModel.findAll({ where: user_id }).then(async userDetail => {
              if (userDetail) {
                NotificationDetailModel.create({ notification: req.body.comment, title: req.body.title }).then(notifications => {
                //console.log(notifications);
                userDetail.forEach(function (value, index) {
                  console.log(value);
                  
                    let user_firebase_id=value.user_firebase_id?value.user_firebase_id:'NO ID';
                    firebaseIds.push(user_firebase_id);
                  
                    UserNotificationModel.create({ user_id: value.user_id, user_device_id: value.user_firebase_id?value.user_firebase_id:null, notification_id: notifications.id })
                    });
                const returnData =  notificationUtility.sentNotificationMultiple(firebaseIds, title, data,notifications.id);
                

              });
                
                /*const returnData = await notificationUtility.sentNotificationMultiple(firebaseIds, title, data);
                console.log(returnData);
                const notification = NotificationDetailModel.create({ notification: req.body.comment, title: req.body.title }).then(notifications => {
                  if (notifications) {
                    const notificationData = UserNotificationModel.create({ user_id: req.body.user_ids, user_device_id: req.body.user_device_id, notification_id: notifications.id, status: req.body.status })
                    return apiResponse.successResponseWithData(res, "Created Successfully.", notificationData);
                  }
                  return apiResponse.successResponseWithData(res, "Created Successfully.", notification);
                })*/
              }
              else {
                return apiResponse.notFoundResponse(res, "Data Not Found");
              }
            })
            return apiResponse.successResponseWithData(res, "Created Successfully.");
          }
          else {
            return apiResponse.notFoundResponse(res, "User Id not found.");
          }
        })
      } else {
        res.render('login');
      }
    }
  ]  


exports.notificatiomaster = [
  (req, res) => {
    NotificationDetailModel.findAll().then(data => {
      res.render('notification',{ posts:req.session.name,data:data});
    });
  }
]
exports.notificatidetail=[
  (req, res) => {
    var notification_id = req.params.id;
    var user_sql = "select u.first_name,u.last_name,n.id,n.title,n.notification,n.log from users_notifications JOIN app_users u ON u.id=d.user_id JOIN notification_details n ON n.id=d.notification_id WHERE n.id="+notification_id+" ";
    UserNotificationModel.sequelize.query(user_sql).then((result) => {
        let statusArr=JSON.parse(result[0][0].log);
        let statusRes=statusArr.results;
        let msgsArr=[];
        statusRes.forEach(function (value, index) {
          
          msgsArr.push(Object.keys(value));
        });
        // console.log(msgsArr);
        let i=0; let c=0;
        let UserListAr = result[0].map((r) => {
        let name=r.first_name+" "+r.last_name;
         
         let sts=msgsArr[i++][0];
         
         var invData =
          {
            name: name,
            status: sts == 'message_id' ? 'Success':'Failure'
          }
          return invData;
       });

      // console.log(UserListAr);
       res.render('notificationdetail',{ posts:req.session.name,data:UserListAr});
    });
    
    /*UserNotificationModel.findAll({ where: {notification_id:notification_id } }).then((data) => {

      let UserListAr = data.map((r) => {
          
      }
      /*UserModel.findAll({where:{id:data.user_id}}).then((name)=>{
     // var fullname=CONCAT(name.first_name ,  ' ',  name.last_name);
        
      })
     
    });*/
  }
]
