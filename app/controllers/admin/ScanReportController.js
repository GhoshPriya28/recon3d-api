const db = require("../../models");
const { BASE_URL, ADMIN_BASE_URL,PORTAL_BASE_URL,EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
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
const axios = require("axios").create({baseURL: EVP_BASE_URL, headers: {'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ=='}});


exports.processing = [
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
       
        
       
        res.render('processing',{ posts:req.session.name,type:req.session.type ,role1:role1,role2:role2,role3:role3,invoiceCount:invoiceCount,invoiceData:invoiceData,moment:moment,bidData:bidData,helper: require("../../helpers/utility")});

       }else{
        res.redirect('login');
       }
    }
]


exports.processingData = [
    async (req, res) => {
      if (!utility.checkUserLogin(req, res)) {
  
      }
      let search = req.body['search[value]'];
      var datesearch = '';
      var searchV = '';
      //Data serach filter date...
      if (req.body.is_date_search == "yes") {
        datesearch = "AND DATE(t.createdAt) BETWEEN '" + req.body.start_date + "' AND '" + req.body.end_date + "'";
      }
      //Data serch like...
      searchV = "AND( u.first_name like '%" + search + "%' || u.last_name like '%" + search + "%' || t.collect_name like '%" + search + "%' || t.ep_collect_id like '%" + search + "%' || t.createdAt like '%" + search + "%')";
      
      let limit = parseInt(req.body.length);
      let draw = req.body.draw;
      let rowCount = 0;
      let offset = parseInt(req.body.start);
      field = req.body['order[0][column]'];
      fieldName = req.body["columns[" + field + "][data]"];
      //console.log("fieldName",fieldName);
      if(fieldName=="name"){
       fieldName='first_name';       
      }
      if(fieldName=="status"){
        fieldName='internal_status';       
       }
      await FileTaskModel.findAll().then(data => {
        data.forEach(element => {
          rowCount++;
        });
      });
      var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id  where t.internal_status='1' and t.s3_file_url IS NOT NULL and email!=''  " + searchV + " " + datesearch + " order by " + fieldName +" " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
      var user_sqlCount = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.internal_status='1' and t.s3_file_url IS NOT NULL and email!=''  " + searchV + " " + datesearch;
      
  
      UserModel.sequelize.query(user_sql).then((result) => {
        UserModel.sequelize.query(user_sqlCount).then((resultC) => {
          let Tcount = resultC[0].length;
          let UserListAr = result[0].map((r) => {
            if (r.internal_status == 0 && r.ep_collect_id) {
              var es = '<td><div class="badge badge-warning"> Processing</div></td>';
            } else if (r.internal_status == 0 ) {
              var es = '<td><div class="badge badge-info">Initiated</div></td>';
            }
            else if(r.internal_status == 1)
            {
              var es = '<td><div class="badge badge-warning"> Processing</div></td>';
            }
            else if(r.internal_status == 3)
            {
              var es = '<td><div class="badge badge-danger">Failed</div></td>';
            }
            else {
              var es = '<td><div class="badge badge-success">Completed</div></td>';
            }
            var assets = '<td><a href="/web/admin/collectdetail/' + r.id + '" class="badge badge-info">View</a></td>';
            var fullname=r.first_name
            if(r.last_name!='' && r.last_name!=null)
            {
              fullname=r.first_name+' '+r.last_name;
            }
            var invoiceData =
            {
              id: r.id,
              initiate_id: r.initiate_id,
              ep_collect_id: r.ep_collect_id,
              collect_name: r.collect_name?r.collect_name:'',
              user_id: r.user_id,
              s3_file_url: assets,
              s3_3d_url: r.s3_3d_url,
              name: fullname,
              //add_date
              email: r.email,
              //moment().format('YYYY-MM-DD h:mm:ss')
              createdAt: moment(r.createdAt).format('DD-MM-YYYY h:mm:ss'),
              status: es,
              assets: assets,
              //createdAt:r.createdAt==null ? '':utility.formatDateYMD(r.createdAt),
  
  
            }
            return invoiceData;
          });
          //console.log(result);
  
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


exports.initiate = [
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
       
        
       
        res.render('initiate',{ posts:req.session.name,type:req.session.type ,role1:role1,role2:role2,role3:role3,invoiceCount:invoiceCount,invoiceData:invoiceData,moment:moment,bidData:bidData,helper: require("../../helpers/utility")});

       }else{
        res.redirect('login');
       }
    }
]


exports.initiateData = [
    async (req, res) => {
      if (!utility.checkUserLogin(req, res)) {
  
      }
      let search = req.body['search[value]'];
      var datesearch = '';
      var searchV = '';
      //Data serach filter date...
      if (req.body.is_date_search == "yes") {
        datesearch = "AND DATE(t.createdAt) BETWEEN '" + req.body.start_date + "' AND '" + req.body.end_date + "'";
      }
      //Data serch like...
      searchV = "AND( u.first_name like '%" + search + "%' || u.last_name like '%" + search + "%' || t.collect_name like '%" + search + "%' || t.ep_collect_id like '%" + search + "%' || t.createdAt like '%" + search + "%')";
      
      let limit = parseInt(req.body.length);
      let draw = req.body.draw;
      let rowCount = 0;
      let offset = parseInt(req.body.start);
      field = req.body['order[0][column]'];
      fieldName = req.body["columns[" + field + "][data]"];
      //console.log("fieldName",fieldName);
      if(fieldName=="name"){
       fieldName='first_name';       
      }
      if(fieldName=="status"){
        fieldName='internal_status';       
       }
      await FileTaskModel.findAll().then(data => {
        data.forEach(element => {
          rowCount++;
        });
      });
      var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.collect_name,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id  where t.internal_status='0'  and email!=''  " + searchV + " " + datesearch + " order by " + fieldName +" " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
      var user_sqlCount = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.internal_status='0'  and email!=''  " + searchV + " " + datesearch;
      
  
      UserModel.sequelize.query(user_sql).then((result) => {
        UserModel.sequelize.query(user_sqlCount).then((resultC) => {
          let Tcount = resultC[0].length;
          let UserListAr = result[0].map((r) => {
           /* if (r.internal_status == 0 && r.ep_collect_id) {
              var es = '<td><div class="badge badge-warning"> Processing</div></td>';
            } else
            
            */
           if (r.internal_status == 0 ) {
              var es = '<td><div class="badge badge-info">Initiated</div></td>';
            }
            else if(r.internal_status == 1)
            {
              var es = '<td><div class="badge badge-warning"> Processing</div></td>';
            }
            else if(r.internal_status == 3)
            {
              var es = '<td><div class="badge badge-danger">Failed</div></td>';
            }
            else {
              var es = '<td><div class="badge badge-success">Completed</div></td>';
            }
            var assets = '<td><a href="/web/admin/collectdetail/' + r.id + '" class="badge badge-info">View</a></td>';
            var fullname=r.first_name
            if(r.last_name!='' && r.last_name!=null)
            {
              fullname=r.first_name+' '+r.last_name;
            }
            var invoiceData =
            {
              id: r.id,
              initiate_id: r.initiate_id,
              ep_collect_id: r.ep_collect_id,
              collect_name: r.collect_name?r.collect_name:'',
              user_id: r.user_id,
              s3_file_url: assets,
              s3_3d_url: r.s3_3d_url,
              name: fullname,
              //add_date
              email: r.email,
              //moment().format('YYYY-MM-DD h:mm:ss')
              createdAt: moment(r.createdAt).format('DD-MM-YYYY h:mm:ss'),
              status: es,
              assets: assets,
              //createdAt:r.createdAt==null ? '':utility.formatDateYMD(r.createdAt),
  
  
            }
            return invoiceData;
          });
          //console.log(result);
  
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


exports.settingList = [
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
     
      
     
      res.render('priority_list',{ posts:req.session.name,type:req.session.type ,role1:role1,role2:role2,role3:role3,invoiceCount:invoiceCount,invoiceData:invoiceData,moment:moment,bidData:bidData,helper: require("../../helpers/utility")});

     }else{
      res.redirect('login');
     }
  }
]
exports.settingListData = [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {

    }
    let search = req.body['search[value]'];
    var datesearch = '';
    var searchV = '';
    //Data serach filter date...
    if (req.body.is_date_search == "yes") {
      datesearch = "AND DATE(t.createdAt) BETWEEN '" + req.body.start_date + "' AND '" + req.body.end_date + "'";
    }
    //Data serch like...
    searchV = "AND( u.first_name like '%" + search + "%' || u.last_name like '%" + search + "%' || t.collect_name like '%" + search + "%' || t.ep_collect_id like '%" + search + "%' || t.createdAt like '%" + search + "%')";
    
    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    let offset = parseInt(req.body.start);
    field = req.body['order[0][column]'];
    fieldName = req.body["columns[" + field + "][data]"];
    //console.log("fieldName",fieldName);
    if(fieldName=="name"){
     fieldName='first_name';       
    }
    if(fieldName=="status"){
      fieldName='internal_status';       
     }
    await FileTaskModel.findAll().then(data => {
      data.forEach(element => {
        rowCount++;
      });
    });
    var user_sql = "SELECT t.id as task_id,p.user_id,p.initiate_id,p.process_priority,t.collect_name,u.id,t.ep_collect_id as job_id FROM `pre_complete_tasks` p JOIN app_users u ON u.id=p.user_id INNER JOIN file_tasks t ON t.initiate_id=p.initiate_id order by " + fieldName +" " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    var user_sqlCount = "SELECT p.user_id,p.initiate_id,p.process_priority,t.collect_name,u.id FROM `pre_complete_tasks` p JOIN app_users u ON u.id=p.user_id INNER JOIN file_tasks t ON t.initiate_id=p.initiate_id";
    

    UserModel.sequelize.query(user_sql).then((result) => {
      UserModel.sequelize.query(user_sqlCount).then((resultC) => {
        let Tcount = resultC[0].length;
        let UserListAr = result[0].map((r) => {
         /* if (r.internal_status == 0 && r.ep_collect_id) {
            var es = '<td><div class="badge badge-warning"> Processing</div></td>';
          } else
          
          */
         if (r.internal_status == 0 ) {
            var es = '<td><div class="badge badge-info">Initiated</div></td>';
          }
          else if(r.internal_status == 1)
          {
            var es = '<td><div class="badge badge-warning"> Processing</div></td>';
          }
          else if(r.internal_status == 3)
          {
            var es = '<td><div class="badge badge-danger">Failed</div></td>';
          }
          else {
            var es = '<td><div class="badge badge-success">Completed</div></td>';
          }
          var assets = '<td><a href="/web/admin/collectdetail/' + r.id + '" class="badge badge-info">View</a></td>';
          var fullname=r.first_name
          if(r.last_name!='' && r.last_name!=null)
          {
            fullname=r.first_name+' '+r.last_name;
          }
          var invoiceData =
          {
            id: r.task_id,
            initiate_id: r.initiate_id,
            ep_collect_id: r.ep_collect_id,
            collect_name: r.collect_name?r.collect_name:'',
            user_id: r.user_id,
            process_priority: r.process_priority,
            s3_3d_url: r.s3_3d_url,
            name: fullname,
            job_id:r.job_id,
            //add_date
            email: r.email,
            //moment().format('YYYY-MM-DD h:mm:ss')
            createdAt: moment(r.createdAt).format('DD-MM-YYYY h:mm:ss'),
            status: es,
            assets: assets,
            //createdAt:r.createdAt==null ? '':utility.formatDateYMD(r.createdAt),


          }
          return invoiceData;
        });
        //console.log(result);

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


exports.priorityQ = [
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

     var user_sql = "SELECT t.id as task_id,p.user_id,p.initiate_id,p.process_priority,t.collect_name,u.id,u.first_name,u.last_name,t.ep_collect_id as job_id,t.file_type,t.file_ext,p.complete_status FROM `pre_complete_tasks` p JOIN app_users u ON u.id=p.user_id INNER JOIN file_tasks t ON t.initiate_id=p.initiate_id  group by p.initiate_id  order by p.process_priority,p.updatedAt desc";
    UserModel.sequelize.query(user_sql).then((result) => {
      let scanListAr = result[0].map((r) => {
        var p=r.process_priority;
        var priority='';
        if(p>90 && p<=100)
        {
          priority=3;
            var bg='bg-success';                          
        }
        else if(p>80 && p<=90)
        {
          priority=2;
          var bg='bg-warning'; 
        }
        else if(p>=70 && p<=80)
        {
          priority=1;
          var bg='bg-primary'; 
        }
        let name=r.first_name;
        if(r.last_name)
        {
          name=r.first_name +' '+r.last_name;
        }
        let type='';
        if(r.file_ext=='epars' || r.file_ext=='eparls')
        {
          type="Lidar with Video Fusion";
        }
        else if(r.file_type=='video')
        {
          type="Photogrammetry video"; 
        }
        else if(r.file_type=='images')
        {
          type="Photogrammetry Photos";
        }
        var invoiceData =
          {
            id: r.task_id,
            initiate_id: r.initiate_id,
            ep_collect_id: r.ep_collect_id,
            bg:bg,
            name:name,
            type:type,
            collect_name: r.collect_name?r.collect_name:'',
            job_id:r.job_id,
            complete_status:r.complete_status,
            priority:priority
          }
          return invoiceData;

      });

      console.log(scanListAr);
      res.render('priorityQues',{ posts:req.session.name,type:req.session.type ,role1:role1,role2:role2,role3:role3,invoiceCount:invoiceCount,scanListAr:scanListAr,moment:moment,bidData:bidData,helper: require("../../helpers/utility")});

    });
    
   
    
   }else{
    res.redirect('login');
   }
  }
]

//Update Jobs...
exports.updatejobs = [
  (req, res) => {

    try {

      // console.log("Role value :: "+req.body.role);
      var initiate_id = req.body.job;
      var priority = req.body.priority;
      let process_priority=75;
      if(priority==3)
      {
        process_priority=100;
      }
      else if(priority==2)
      {
        process_priority=90;
      }
      else if(priority==1)
      {
        process_priority=79;
      }
  
      PreCompleteTaskModel.update(
        { process_priority: process_priority } ,
        { where: { initiate_id: initiate_id } } 
      ).then(function (affectedRows) {
        if (affectedRows) {
          let data = { "status": "success", "message": "Priority has been successfully updated" };
          res.send(JSON.stringify(data));
        }
        else {
          let data = { "status": "error", "message": "Not updated" };
          res.send(JSON.stringify(data));
        }
      });



    } catch (err) {

      return apiResponse.ErrorResponse(res, err);
    }
  }
]