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
//console.log(imageBasePath);
//login 
exports.login = [
    (req, res) => {
        //console.log(req.query.error);
        if(req.session.name){
            res.render('dashboard',{ posts:req.session.name  });
        }else{
            //console.log(req);
            res.render('login');

        }
       
    }
]

exports.loginapi = [
    
    body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
        .isEmail().withMessage("Email must be a valid email address."),
    body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
    sanitizeBody("email").escape(),
    sanitizeBody("password").escape(),
    (req, res) => {
       
        try {
            //console.log(req.body);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                
                return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
            }else {
                
                var query = {email : req.body.email};
               
                //console.log(query);
                LoginModel.findOne({
                    
                    where: query
                }).then(user => {
                   
                    if (user) {
                        
                        //Compare given password with db's hash.
                        
                        bcrypt.compare(req.body.password,user.password,function (err,same) {
                           // console.log(req.body.password,user.password);
                            if(same){
                               
                                //Check account confirmation.
                                
                                    // Check User's account active or not.
                                    
                                    
                                    
                                        var result={
                                            name:user.id,
                                            name:user.name,
                                            email:user.email,
                                            password:user.password,
                                            contact:user.contact,
                                            type:user.type,
                                            status:user.status,
                                            
                                        }
                                        req.session.name =user.id;
                                     req.session.name =user.name;
                                     req.session.email =user.email;
                                     req.session.contact =user.contact;
                                     req.session.type =user.type;
                                     req.session.type=user.status
                                     req.session.userlogin = 1;
                                        console.log(req);
                                   var data={"status":"success","message":"Login Successfully"};
                                   res.send( JSON.stringify(data));
                                   
                                
                            }else{
                                var data={"status":"error","message":"Your Email or Password is wrong"};
                                res.send( JSON.stringify(data));
                               
                               
                            }
                        });
                    }else{
                        var data={"status":"error","message":"Your Email or Password is wrong"};
                        res.send( JSON.stringify(data));
                       
                    }
                });
            }
            
        } catch (err) {
            
            return apiResponse.ErrorResponse(res, err);
        }
    }];
//logout
exports.logout = [
    
      
        (req, res) => {
           
            try {
                //console.log(JSON.stringify(req.session));
                req.session.destroy();
                res.redirect('login');
                
            } catch (err) {
                
                return apiResponse.ErrorResponse(res, err);
            }
        }];
        



          
