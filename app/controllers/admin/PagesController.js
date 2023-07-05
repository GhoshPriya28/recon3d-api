const db = require("../../models");
//const UserModel = db.UserModel;
const { LoginModel: LoginModel,UserModel:UserModel,RoleModel:RoleModel,InvoiceModel:InvoiceModel,InvoiceStatusModel:InvoiceStatusModel,CityModel:CityModel,NotificationModel:NotificationModel} = db;
const Op = db.Sequelize.Op;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../../helpers/apiResponse");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const bcrypt = require("bcrypt");
const path = require('url');
const flash = require('connect-flash');
const utility = require("../../helpers/utility");
var moment = require('moment');
var configFile = require('../../config/configFile');
var imageBasePath=configFile.getBaseUrl();
const { constants } = require("../../helpers/constants");
// header
exports.header = [
    (req, res) => {
         res.render('header',{ posts:req.session.name  });
    }
]
exports.footer = [
    (req, res) => {
         res.render('footer',{ posts:req.session.name  });
    }
]
//sidebar
exports.sidebar = [
    (req, res) => {
        res.render('sidebar',{ type:req.session.type  });
    }
]
// dashboard
exports.dashboard = [
    async (req,res) =>  {
        var role1=0;
        var role2=0;
        var role3=0;
        var invoiceCount=0;
        var invoiceData=[];
        var bidData=[];
      //console.log(req.session);
       if(req.session.name){
        await   UserModel.findAll ().then(data => {
            data.forEach(element => {
             //   console.log(element.role);
                if(element.role==1){
                    role1++;
                }
                if(element.role==2){
                    role2++;
                }
                if(element.role==3){
                    role3++;
                }
    
            });
        });
       
        
       
        res.render('dashboard',{ posts:req.session.name,type:req.session.type,role1:role1,role2:role2,role3:role3,invoiceCount:invoiceCount,invoiceData:invoiceData,moment:moment,bidData:bidData,helper: require("../../helpers/utility")});

       }else{
        res.redirect('login');
       }
    }
]
