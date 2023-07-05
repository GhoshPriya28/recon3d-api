const db = require("../../models");
const { BASE_URL, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
//const UserModel = db.UserModel;
const { UserModel: UserModel, FileTaskModel: FileTaskModel,SubFileTaskModel:SubFileTaskModel, EmailTamplateModel: EmailTamplateModel, TermsModel: TermsModel, PrivacyPolicyModel: PrivacyPolicyModel, EmailsupportModel: EmailsupportModel, FaqsModel: FaqsModel, TutorialsModel: TutorialsModel } = db;
const Op = db.Sequelize.Op;
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../../helpers/apiResponse");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const excel = require("exceljs");
var moment = require('moment');
var Sequelize = db.Sequelize.Sequelize;
exports.download_excel = [
    (req, res) => {
        try {
            let whereType='';  let duration='';
            const today = moment();   
            var currentDate = today.format('YYYY-MM-DD'); var plan='';  
            if(req.query.duration)
            {
                if(req.query.duration==0)
                {
                    duration="AND p.product_id='com.Recon3D.StandardOneMonthPack'";
                }
                else if(req.query.duration==1)
                {
                    duration="AND p.product_id='com.Recon3d.OneYearPack'";
                }
            }
            
            if(req.query.user_type)
            {
                if(req.query.user_type==0)
                {
                    whereType='AND u.is_subscribe=0';
                }
                else if(req.query.user_type==1)
                {
                    whereType='AND u.is_subscribe=';
                }
                else if(req.query.user_type==2)
                {
                   
                    whereType='AND "'+currentDate+'">=u.subscribe_starts AND "'+currentDate+'"<=u.subscribe_ends';
                }
            }
            
            //console.log(req.query);
            //process.exit();
            var sql='SELECT u.id,u.first_name,u.last_name,u.email,u.orgnization_name,u.is_subscribe,u.createdAt,u.subscribe_starts,u.subscribe_ends,p.product_id,p.createdAt as subscription_date from app_users u LEFT JOIN payment_details p on p.user_id=u.id where u.id IS NOT NULL '+whereType+'  ORDER by id DESC';
           
           
            //UserModel.findAll({order: [['id', 'DESC']]}).then((objs) => {
            UserModel.sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT }).then(async (objs) => {    
                
                
                    let tutorials = [];
                     
                    objs.forEach((obj) => {
                     
                    if(obj.product_id=='com.Recon3d.OneYearPack')
                    {
                        plan='Yearly';
                    }
                    else if(obj.product_id=='com.Recon3D.StandardOneMonthPack')
                    {
                        plan='Monthly';
                    }
                    var subscribe='Free';
                    if (currentDate >= obj.subscribe_starts && currentDate <= obj.subscribe_ends) {
                         subscribe = 'Trial';
                    }
                    else if(obj.is_subscribe == 1)
                    {
                     subscribe = 'Subscribe';
                    }
                    if(obj.is_subscribe == 0) {
                    var subscribe = 'Free';
                    }
                   
                    tutorials.push({
                        user_id: obj.id,
                        first_name: obj.first_name,
                        last_name: obj.last_name,
                        email: obj.email,
                        orgnization_name: obj.orgnization_name,
                       // status:(element.status == 0) ? 'Initiate':((element.status == 1)? 'Pending':((element.status == 2)?'Completed':''))
                        //is_subscribe:(obj.is_subscribe==0)?'Free':((obj.is_subscribe==1)?'Subscribed':''),
                        is_subscribe:subscribe,
                        createdAt:obj.createdAt,
                        subscription_date:obj.subscription_date,
                        plan:plan
                    });
                    });
                   
                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet("Tutorials");
                    worksheet.columns = [
                    { header: "Id", key: "user_id", width: 5 },
                    { header: "First Name", key: "first_name", width: 25 },
                    { header: "Last Name", key: "last_name", width: 25 },
                    { header: "Email", key: "email", width: 25 },
                    { header: "Subscription Status", key: "is_subscribe", width: 10 },
                    { header: "Company", key: "orgnization_name", width: 10 },
                    { header: "Registration Date", key: "createdAt", width: 10 },
                    { header: "Subscription Date", key: "subscription_date", width: 10 },
                    { header: "Subscription Type", key: "plan", width: 10 },
                    ];
                    // Add Array Rows
                    worksheet.addRows(tutorials);

                    
                    res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                    const utc = new Date().toISOString().slice(0, 10);
                    res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "user_list-"+utc+".xlsx"
                    );
                    return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                    });
                
            });
        } catch (err) {

          return apiResponse.ErrorResponse(res, err);
        }
        
  
    }
  ]