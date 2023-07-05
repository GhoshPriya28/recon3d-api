const db = require("../../models");
const { BASE_URL, ADMIN_BASE_URL, PORTAL_BASE_URL, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
//const UserModel = db.UserModel;
const {  DbBackupModel: DbBackupModel } = db;
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
var rimraf = require("rimraf");
const everypointProcess = require("../../helpers/everypointProcess2");
const axios = require("axios").create({ baseURL: EVP_BASE_URL, headers: { 'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ==' } });

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// db list
exports.dblist = [
  (req, res) => {
    utility.checkUserLogin(req, res);
    DbBackupModel.findAll().then(data => {
      res.render('dblist', { posts: req.session.name, data: data, type:req.session.type });
    });
  }
]

exports.create = [
  async function (req, res) {
      utility.checkUserLogin(req, res);
        try {
          // dateString = dateString.split(' ').slice(0, 4).join(' ');
            let currentDate = new Date().toUTCString().replace(' GMT','').replaceAll(' ','').replaceAll(":","-").replace(',','')
            // let currentDate = new Date().toUTCString().replace(' GMT','')

            // let currentDate = new Date().toUTCString().replace(' GMT','').replaceAll(' ','')
            // let currentDate = new Date().toUTCString().replace(' GMT','')
            // var currentDate = new Date().toUTCString();
            console.log("currentDate", currentDate);
            var boolData = 1;
            while(boolData!=0){
              try{
                const { stdout, stderr } = await exec("C:/xampp/mysql/bin/mysqldump.exe -u root recon3d > ./backupDB/recon3dBackup"+ currentDate +".sql")
                boolData = 0
                console.log("Triggered 1111")
              }catch{
                console.log("Triggered")
                const { stdout, stderr } = await exec("md backupDB")
              }
              
            }
            DbBackupModel.create({
              file_name: "recon3dBackup"+currentDate+".sql",
              file_url: "/web/admin/download-db/recon3dBackup"+currentDate+".sql"
            })
            return apiResponse.successResponse(res, "Backup Success!!")
        }
        catch (err) {
            console.error(err);
            return apiResponse.notFoundResponse(res, err)
        }
    }
  ]



















































