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




//profile
exports.profile = [
    (req, res) => {
        var userDoc;
        var documentView;
         RoleModel.hasMany(UserModel, {foreignKey: 'role'});
        UserModel.belongsTo(RoleModel, {foreignKey: 'role'});
        UserModel.findAll({where:{id:req.params.user_id},include: [RoleModel]}).then(data => {
            //console.log("Role value :: "+RoleModel);
          // console.log(data);
          var allImg=[];
          if(data !=undefined && data[0] !=undefined ){
            if(data[0].documents){
                 userDoc=data[0].documents;
            userDoc= userDoc.replace(/'/g, '"');
            let chkArray=JSON.parse(userDoc);
            if(Array.isArray(chkArray))
            {
                let imgArray=chkArray;
                 documentView=constants.path.documentsViewPath;
                imgArray.map(function(item, index){
                    allImg[index]=imageBasePath+documentView+item;
                });
            }
            }
            
            res.render('profile',{posts:req.session.name,data:data,url:imageBasePath+constants.path.profileViewPath,allImg:allImg,alert:"sdgsdfyasfyae"});
        }else{

            res.redirect("/web/admin/dashboard");
        }
           
           });
          
    }
]
//user list
exports.userlist = [
    (req, res) => {

        //console.log(imageBasePath+constants.path.profileViewPath);
     RoleModel.hasMany(UserModel, {foreignKey: 'role'});
     UserModel.belongsTo(RoleModel, {foreignKey: 'role'});
     
 //    Post.find({ where: { ...}, include: [User]})

        UserModel.findAll({where: { role:[1]},include: [RoleModel]}).then(data => {
           // console.log(data[0].i3_role_master.title);
           
            res.render('userlist',{posts:req.session.name,data:data});
           });
        
    }
]
//seller list
exports.sellerlist = [
    (req, res) => {
        RoleModel.hasMany(UserModel, {foreignKey: 'role'});
        UserModel.belongsTo(RoleModel, {foreignKey: 'role'});

        UserModel.findAll({where:{role:[2]},include: [RoleModel]}).then(data => {
           // console.log(data);
           
            res.render('sellerlist',{posts:req.session.name,data:data});
           });
        
    }
]
//fincierlist
exports.fiancierlist = [
    (req, res) => {

        console.log(req.body);
        console.log(req.params);

        RoleModel.hasMany(UserModel, {foreignKey: 'role'});
        UserModel.belongsTo(RoleModel, {foreignKey: 'role'});
        UserModel.findAll({where:{role:[3]},include: [RoleModel]}).then(data => {
           // console.log(data);
           
            res.render('fiancierlist',{posts:req.session.name,data:data});
           });
        
    }
]
//update profile
exports.updateprofile = [
            (req, res) => {
                       
                        try {
        
                           // console.log("Role value :: "+req.body.role);
                          var role=req.body.role;
                            UserModel.update(
                                { status: req.body.status } /* set attributes' value */, 
                                { where: { id : req.body.id }} /* where criteria */
                          ).then(function(affectedRows) {
                        var statusmsg="";
                             if(req.body.status==1){
                                 statusmsg="Active";
                             }else if(req.body.status==2){
                                statusmsg="Deactive";
                            }else {
                                statusmsg="Pending";
                            }




                    var notimsg="dear "+req.body.name+" has been "+statusmsg+" from "+req.session.name;
                    
                            //console.log(req.session.id);
                
                             NotificationModel.create({ to_user:req.body.id,from_user:req.session.userlogin,notification:notimsg}).then(notidata => {
                           
                    
                            });     

                          UserModel.findAll().then(function(Projects) {
                              // console.log("Pojects"+role);
                               if(role==1){
                                res.redirect('/web/admin/userlist');
                               }else if(role==2){
                                res.redirect('/web/admin/sellerlist');
            
                             
                               }else if(role==3){
                                res.redirect('/web/admin/fiancierlist');
            
                             
                               }else{
                            res.redirect('dashboard');
        
                               }
        
                               
                          });
                        });
                          
                        
                            
                        } catch (err) {
                            
                            return apiResponse.ErrorResponse(res, err);
                        }
                    }];
// admin profile
exports.adminprofile = [
    (req, res) => {
        res.render('adminprofile',{posts:req.session.name});
    }
]