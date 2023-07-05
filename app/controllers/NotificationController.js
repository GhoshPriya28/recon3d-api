const db = require("../models");
const { UserModel: UserModel, InvoiceModel:InvoiceModel,InvoiceStatusModel:InvoiceStatusModel,NotificationModel:NotificationModel} = db;
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
//const { master } = require("../helpers/master");
const master = require("../helpers/master");
var configFile = require('../config/configFile');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('AuthKey');
const path = require('url');
const auth = require("../middlewares/jwt");
const date = require('date-and-time')
const { count } = require("console");


exports.notificationList=[
    auth,
    (req, res) => {
        try {
           if(req.user)
           {
                var query = {to_user : req.user.user_id};
               // console.log(query);
                NotificationModel.findAll({ where:query}).then(function(notification) {
                    let notificationList=notification.map((r) => { 
                         return r.dataValues; 
                    });
                    return apiResponse.successResponseWithData(res,"Notification List.", notificationList);
                 // console.log(notification);
                });
                //return apiResponse.notFoundResponse(res, 'Please provide page no and limit');
           }
           else
           {
               return apiResponse.notFoundResponse(res, "User not found!");
           }
            
        } catch (err) {
            //throw error in json response with status 500.
            return apiResponse.ErrorResponse(res, err);
        }
    }
];
