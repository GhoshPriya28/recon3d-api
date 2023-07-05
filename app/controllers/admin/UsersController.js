const db = require("../../models");
const { BASE_URL, ADMIN_BASE_URL,PORTAL_BASE_URL,EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
//const UserModel = db.UserModel;
const { UserModel: UserModel, FileTaskModel: FileTaskModel, EmailTamplateModel: EmailTamplateModel, TermsModel: TermsModel, PrivacyPolicyModel: PrivacyPolicyModel, EmailsupportModel: EmailsupportModel, FaqsModel: FaqsModel, TutorialsModel: TutorialsModel,PreCompleteTaskModel:PreCompleteTaskModel,PaymentModel:PaymentModel} = db;
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




//profile
exports.profile = [
  (req, res) => {


  }
]
//Consumerlist 
exports.Userlist = [
  (req, res) => {
    utility.checkUserLogin(req, res);

    UserModel.findAll().then(data => {
      res.render('userlist', { posts: req.session.name, data: data,type:req.session.type });
    });

  }
]


//update profile
exports.profileUpdate = [
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      } else {
        // UserModel.findOne({ where: { id: req.body.id } }).then(user => {
        // console.log("user", user);
        // if(user.user_mobile == null || user.user_mobile) {
        let first_name=req.body.first_name?req.body.first_name:'';
        let last_name=req.body.last_name?req.body.last_name:'';
        let user_mobile=req.body.last_name?req.body.last_name:'';
        let orgnization_name=req.body.orgnization_name?req.body.orgnization_name:'';
        let job_priority=req.body.job_priority?req.body.job_priority:'';

        var queryTask = { first_name: first_name, last_name: last_name, user_mobile: user_mobile, orgnization_name: orgnization_name,job_priority:job_priority};
        UserModel.update(queryTask, {
          where: { id: req.body.id }
        }).catch(err => {
          return apiResponse.ErrorResponse(res, err);
        });
        return apiResponse.successResponseWithData(res, "Updated successfully.");
        // }
        // })
        //if end
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error)
    }
  }
]
// admin profile
exports.adminprofile = [
  (req, res) => {
    utility.checkUserLogin(req, res);
    res.render('adminprofile', { posts: req.session.name,type:req.session.type });
  }
]
//user profile
exports.userProfile = [

  (req, res) => {

    utility.checkUserLogin(req, res);
    res.render('userProfile', { posts: req.session.name,type:req.session.type });
  }
]

exports.home = [

  (req, res) => {
    utility.checkUserLogin(req, res);
    UserModel.findAll({ where: { id: req.params.id } }).then((data) => {
      res.render('home', { posts: req.session.name, data: data ,type:req.session.type});
    });
  }
]
exports.userlistdataOld= [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/login');
    }

    
    let search = req.body['search[value]'];
    var searchV='';
    if(search)
    {
      searchV="where first_name like '%"+search+"%' || last_name like '%"+search+"%' || email like '%"+search+"%'";
    }
    var ser='';
    
    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    var dd='';
    //console.log(draw);
    let offset = parseInt(req.body.start);
    
    await UserModel.findAll().then(data => {

      data.forEach(element => {
        rowCount++;

      });

    });
    field = req.body['order[0][column]'];
    fieldName = req.body["columns[" + field + "][data]"];
    var user_sql = "SELECT *,(select count(*) from file_tasks where user_id=app_users.id) as total_upload FROM `app_users` " + searchV + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    //var user_sqlCount ="select * from app_users";
    var user_sqlCount ="select * from app_users "+searchV;
    UserModel.sequelize.query(user_sql).then((result)=>{
      UserModel.sequelize.query(user_sqlCount).then((resultC)=>{
        
          //data[index] = { id: element.id, first_name: element.first_name, last_name: element.last_name, email: element.email, orgnization_name: element.orgnization_name,total_upload:dataC};
          let Tcount=resultC[0].length;
          let UserListAr=result[0].map((r) => {
            var view = '<td><a href="/web/admin/home/' + r.id + '" class="badge badge-info">View</a></td>'
            FileTaskModel.count({where:{user_id:r.id}}).then(dataC=>{
              dd=dataC;
              //data[index] = { id: element.id, first_name: element.first_name, last_name: element.last_name, email: element.email, orgnization_name: element.orgnization_name,total_upload:dataC};
    
            });
            var invoiceData =
            {
                id:r.id,
                first_name:r.first_name,
                last_name:r.last_name,
                name:r.first_name+' '+r.last_name,
                email :r.email ,
                orgnization_name:r.orgnization_name,
                total_upload:r.total_upload,
                view:view
                //createdAt:r.createdAt==null ? '':utility.formatDateYMD(r.createdAt),
                
                
               }
               return invoiceData;
          });
          
          
              let fdata={
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

// exports.userlistdata = [
//   async (req, res) => {
//     if (!utility.checkUserLogin(req, res)) {
//       res.redirect('/login');
//     }

    
//     let search = req.body['search[value]'];
//     var searchV='';
//     var filterUserType='';
//     var is_subscribe='';
//     if(req.body.user_type!='' && req.body.user_type!='no')
//     {
//        is_subscribe=req.body.user_type;
//     }

//     var range='';
//     if(req.body.duration!='' && req.body.duration!='no')
//     {
       
//        if(req.body.duration==0)
//        {
//         range='com.Recon3D.StandardOneMonthPack';
//        }
//        else if(req.body.duration==1)
//        {
//         range='com.Recon3d.OneYearPack';
//        }
       
//     }
   
//     if(search)
//     {
//       if(is_subscribe)
//       {
//         filterUserType=" is_subscribe="+ is_subscribe +"  ";
//         console.log("filterUserType", filterUserType);
//       }

//       if(range)
//       {
//         filterDuration=" product_id="+ range +"  ";
//       }
//       searchV="where " + filterUserType+ " first_name like '%"+search+"%' || last_name like '%"+search+"%' || email like '%"+search+"%'";
//     }
//     else
//     {
//       if(is_subscribe)
//       {
//         if(is_subscribe==2)
//         {
//           const today = moment();   
//           var currentDate = today.format('YYYY-MM-DD');
//           filterUserType='"'+currentDate+'">subscribe_starts AND "'+currentDate+'"<=subscribe_ends';
//           //filterUserType=" is_subscribe="+ is_subscribe +"  ";
//         }
//         else if(range)
//         {
//           filterDuration=" product_id="+ range +"  ";
//         }
//         else
//         {
//           filterUserType=" is_subscribe="+ is_subscribe +"  ";
//         }
//        // filterUserType=" is_subscribe="+ is_subscribe +"  ";
//         searchV=" AND " +filterUserType
//       }
//       // console.log("searchV", searchV);
//     }
    
//     var ser='';
    
//     let limit = parseInt(req.body.length);
//     let draw = req.body.draw;
//     let rowCount = 0;
//     var dd='';
//     //console.log(draw);
//     let offset = parseInt(req.body.start);
    
    
//     fieldName = req.body["columns[" + field + "][data]"];
//     // var user_sql = "SELECT *,(select count(*) from file_tasks where user_id=app_users.id) as total_upload ,(SELECT to_date from payment_details where user_id=app_users.id LIMIT 1) as exp_date FROM `app_users` " + searchV + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;

//     var user_sql="SELECT u.id,u.first_name,u.last_name,u.email,u.orgnization_name,u.is_subscribe,u.createdAt,u.subscribe_starts,u.subscribe_ends,p.product_id,p.createdAt as subscription_date, (select count(*) from file_tasks where user_id=u.id) as total_upload from app_users u LEFT JOIN payment_details p on p.user_id=u.id where u.id IS NOT NULL " + searchV + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;

//     //var user_sqlCount ="select * from app_users";
//     var user_sqlCount ="SELECT u.id,u.first_name,u.last_name,u.email,u.orgnization_name,u.is_subscribe,u.createdAt,u.subscribe_starts,u.subscribe_ends,p.product_id,p.createdAt as subscription_date, (select count(*) from file_tasks where user_id=u.id) as total_upload from app_users u LEFT JOIN payment_details p on p.user_id=u.id where u.id IS NOT NULL "+searchV+" ";
    
//     UserModel.sequelize.query(user_sql).then(async(result)=>{
//       UserModel.sequelize.query(user_sqlCount).then(async(resultC)=>{

        
//           //data[index] = { id: element.id, first_name: element.first_name, last_name: element.last_name, email: element.email, orgnization_name: element.orgnization_name,total_upload:dataC};
//           let Tcount=resultC[0].length;
//            //const payment_details = await PaymentModel.findOne( { where: { user_id:r.id }});

            
//           let UserListAr=result[0].map((r) => {
//             var view = '<td><a href="/web/admin/home/' + r.id + '" class="badge badge-info">View</a></td>'
//             FileTaskModel.count({where:{user_id:r.id}}).then(async dataC=>{
//               dd=dataC;
//               //data[index] = { id: element.id, first_name: element.first_name, last_name: element.last_name, email: element.email, orgnization_name: element.orgnization_name,total_upload:dataC};
    
//             });
            
//             let expDate='';
//             if(r.exp_date)
//             {
//               expDate=moment(r.exp_date).format('DD-MM-YYYY')
//             }
//             var currentDate = new Date();
//             const today = moment();
//             console.log("today", today);
//             currentDate = today.format('YYYY-MM-DD');
            
//             if (currentDate >= r.subscribe_starts && currentDate <= r.subscribe_ends) {
//               var subscribe = '<div class="badge badge-info">Trial</div>';
//             }
//             else if(r.is_subscribe == 1)
//             {
//               var subscribe = '<div class="badge badge-success">Subscribed</div>';
//             }
//             else if(r.is_subscribe == 0) {
//               var subscribe = '<div class="badge badge-warning">Free</div>';
//             }
//            //console.log(payment_details);
//             var invoiceData =
//             {
//                 id:r.id,
//                 first_name:r.first_name,
//                 last_name:r.last_name,
//                 name:r.first_name+' '+r.last_name,
//                 email :r.email ,
//                 is_subscribe:subscribe,
//                 exp_date:expDate,
//                 total_upload:r.total_upload,
//                 view:view
//                 //createdAt:r.createdAt==null ? '':utility.formatDateYMD(r.createdAt),
                
                
//                }
//                return invoiceData;
//           });
          
          
//               let fdata={
//               "draw": draw,
//               "recordsTotal": Tcount,
//               "recordsFiltered": Tcount,
//               "data": UserListAr
//             };
//             res.send(fdata);
           
//         });
          
      
     
//   });
    
//   }


  
// ] 

//testing priya ghosh
exports.userlistdata = [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/login');
    }

    let search = req.body['search[value]'];
    var searchV = '';
    var filterUserType = '';
    var is_subscribe = '';
    if (req.body.user_type != '' && req.body.user_type != 'no') {
      is_subscribe = req.body.user_type;
    }

    var range = '';
    if (req.body.duration != '' && req.body.duration != 'no') {

      if (req.body.duration == 0) {
        range = 'com.Recon3D.StandardOneMonthPack';
      }
      else if (req.body.duration == 1) {
        range = 'com.Recon3d.OneYearPack';
      }

    }

    if (search) {
      console.log("if log");
      if (is_subscribe) {
        filterUserType = " is_subscribe=" + is_subscribe + "  ";
        console.log("filterUserType", filterUserType);
      }

      if (range) {
        filterDuration = " product_id=" + range + "  ";
      }
      searchV = "where " + filterUserType + " first_name like '%" + search + "%' || last_name like '%" + search + "%' || email like '%" + search + "%'";
    }
    else {
      // console.log("else log");
      if (is_subscribe) {
        // filterUserType = " is_subscribe=" + is_subscribe + "  ";
        console.log("is_subscribe", is_subscribe);
        console.log("range", range);
        if (is_subscribe == 2) {
		  console.log("Subscription: Trial");
          const today = moment();
          // var currentDate = today.format('YYYY-MM-DD');
          // filterUserType = " is_subscribe=" + is_subscribe + "  AND " + currentDate + " BETWEEN subscribe_starts AND subscribe_ends";
          filterUserType = " is_subscribe=" + is_subscribe + "  AND curdate() " + " BETWEEN subscribe_starts AND subscribe_ends";
          // '"' + currentDate + '">subscribe_starts AND "' + currentDate + '"<=subscribe_ends';
          //filterUserType=" is_subscribe="+ is_subscribe +"  ";
          searchV = " AND " + filterUserType;
        }
		else if (is_subscribe == 0) {
		  console.log("Subscription: Free");
		  filterUserType = " is_subscribe=" + is_subscribe + "  ";
          console.log("filterUserType", filterUserType);
		  searchV = " AND " + filterUserType;
		}
		else if (is_subscribe == 1) {
		  if (range) {
			filterDuration = " product_id='" + range + "'  ";
            console.log("filterDuration", filterDuration);
            filterUserType = " is_subscribe=" + is_subscribe + "  ";
            searchV = " AND " + filterUserType + " AND " + filterDuration;  
		  }
		  else {
			filterUserType = " is_subscribe=" + is_subscribe + "  ";
            searchV = " AND " + filterUserType;
		  }
		}
        // if (filterUserType) {
        //   searchV = " AND " + filterUserType;
        // }
        // else if (filterDuration) {
        //   searchV = " AND " + filterDuration;
        // }
        // searchV = " AND " + filterUserType + " AND " + filterDuration;
        // filterUserType=" is_subscribe="+ is_subscribe +"  ";
        // searchV = " AND " + filterUserType
        console.log("searchV", searchV);
      }

    }

    var ser = '';

    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    var dd = '';
    //console.log(draw);
    let offset = parseInt(req.body.start);


    fieldName = req.body["columns[" + field + "][data]"];


    var user_sql = "SELECT u.id,u.first_name,u.last_name,u.email,u.orgnization_name,u.is_subscribe,u.createdAt,u.subscribe_starts,u.subscribe_ends,p.product_id,p.createdAt as subscription_date, (select count(*) from file_tasks where user_id=u.id) as total_upload from app_users u LEFT JOIN payment_details p on p.user_id=u.id where u.id IS NOT NULL " + searchV + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;

    //var user_sqlCount ="select * from app_users";
    var user_sqlCount = "SELECT u.id,u.first_name,u.last_name,u.email,u.orgnization_name,u.is_subscribe,u.createdAt,u.subscribe_starts,u.subscribe_ends,p.product_id,p.createdAt as subscription_date, (select count(*) from file_tasks where user_id=u.id) as total_upload from app_users u LEFT JOIN payment_details p on p.user_id=u.id where u.id IS NOT NULL " + searchV + " ";

    UserModel.sequelize.query(user_sql).then(async (result) => {
      UserModel.sequelize.query(user_sqlCount).then(async (resultC) => {
        let Tcount = resultC[0].length;
        let UserListAr = result[0].map((r) => {
          var view = '<td><a href="/web/admin/home/' + r.id + '" class="badge badge-info">View</a></td>'
          FileTaskModel.count({ where: { user_id: r.id } }).then(async dataC => {
            dd = dataC;
          });
          let expDate = '';
          if (r.exp_date) {
            expDate = moment(r.exp_date).format('DD-MM-YYYY')
          }
          var currentDate = new Date();
          const today = moment();
          console.log("today", today);
          currentDate = today.format('YYYY-MM-DD');

          if (currentDate >= r.subscribe_starts && currentDate <= r.subscribe_ends) {
            var subscribe = '<div class="badge badge-info">Trial</div>';
          }
          else if (r.is_subscribe == 1) {
            var subscribe = '<div class="badge badge-success">Subscribed</div>';
          }
          else if (r.is_subscribe == 0) {
            var subscribe = '<div class="badge badge-warning">Free</div>';
          }
          //console.log(payment_details);
          var invoiceData =
          {
            id: r.id,
            first_name: r.first_name,
            last_name: r.last_name,
            name: r.first_name + ' ' + r.last_name,
            email: r.email,
            is_subscribe: subscribe,
            exp_date: expDate,
            total_upload: r.total_upload,
            view: view
            //createdAt:r.createdAt==null ? '':utility.formatDateYMD(r.createdAt),


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

  


//Collection details..
//Collection details..
exports.collectdetailOld = [
  async function(req, res){
    utility.checkUserLogin(req, res);
    var assetsurl = [];
    var threeDurl = [];
    var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email,t.createdAt FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.id=" + req.params.id + "";
    UserModel.sequelize.query(user_sql, { type: Sequelize.QueryTypes.SELECT }).then(async (result) => {
      var collect_name=result[0].collect_name;
      var status=result[0].internal_status;
      
      var taskStatus=status== '0'? 'Incomplete':status == '1'? 'Processing':status == '2'?'Completed':status == '3'? 'Failed':'';
      console.log(taskStatus);
      
      
      var pathObject='./downloads/'+result[0].initiate_id+'-objects.zip';
      var pathAsset='./downloads/'+result[0].initiate_id+'-assets.zip';
      var thumbnail='./uploads/eparls/output/'+result[0].initiate_id+'/thumbnail.jpg';
      if (fs.existsSync(thumbnail)) {
         var thumbnailImg = configFile.getBaseUrl()+'eparls/output/'+result[0].initiate_id+'/thumbnail.jpg';
      }
      else
      {
        var thumbnailImg = '';
      }

      var Upload='./uploads/eparls/output/'+result[0].initiate_id+'/arkit_video.mp4';
      if (fs.existsSync(Upload)) {
        
         var uploadVideo= configFile.getBaseUrl()+'eparls/output/'+result[0].initiate_id+'/arkit_video.mp4';
      }
      else
      {
        var uploadVideo = '';
      }
      var resObject='';
      if(result[0].s3_3d_url)
      {
         resObject=JSON.parse(result[0].s3_3d_url);
      }


      //https://recon-assets.s3.us-east-2.amazonaws.com/10973289/URC00000001.M4V
      //console.log('Path'+pathAsset);
      var resAssets='';
      if (result[0].s3_file_url) {
        resAss=JSON.parse(result[0].s3_file_url);

        if(resAss[0])
        {
          resAssets=resAss[0];
          // const thumbOutputPath = "./uploads/thumbnails/";
          // console.log(thumbOutputPath);
          // var fileThumbName='';
          // getThumbnailFromVideo(response,thumbOutputPath,initiateId).then(thumnailName => {
          //    fileThumbName = thumnailName
          //   console.log('File Thumbnail name is ',fileThumbName)
          // });
        }

      }
      let addData=moment(result[0].createdAt).format('DD-MM-YYYY h:mm:ss a');

      /*
      if (result[0].s3_3d_url) {
        if (fs.existsSync(pathObject)) {
          resObject=BASE_URL+'downloads/'+result[0].initiate_id+'-objects.zip';
        }
        else
        {
          var url=BASE_URL+'api/v1/download3DObjects?userId=106&initiateId='+result[0].initiate_id
          await makeRequest(url).then(requestData => {
            console.log(requestData);
            resObject=requestData.data.path;
          }).catch(err => {
            return apiResponse.ErrorResponse(res, err);
          });
        }
        
      }*/
      
      res.render('collectdetail', { posts: req.session.name,collect_name:collect_name,collect_status:taskStatus,data: result, assetsurl: resAssets, threeDurl: resObject,addData:addData,BASE_URL:BASE_URL,ADMIN_BASE_URL:ADMIN_BASE_URL,thumbnailImg:thumbnailImg,uploadVideo:uploadVideo});
    });
  }
]


exports.collectdetail04 = [
  async function(req, res){
    utility.checkUserLogin(req, res);
    var assetsurl = [];
    var threeDurl = [];
    var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.file_type,t.file_ext,t.createdAt,t.task_request,u.first_name,u.last_name,u.email,t.createdAt FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.id=" + req.params.id + "";
    UserModel.sequelize.query(user_sql, { type: Sequelize.QueryTypes.SELECT }).then(async (result) => {
      var collect_name=result[0].collect_name;
      var status=result[0].internal_status;
      
      var taskStatus=status== '0'? 'Incomplete':status == '1'? 'Processing':status == '2'?'Completed':status == '3'? 'Failed':'';
      console.log(taskStatus);
      
      var fileExt=result[0].file_ext;
      var fileType=result[0].file_type;
      //var pathObject='./downloads/'+result[0].initiate_id+'-objects.zip';
      var pathAsset='./downloads/'+result[0].initiate_id+'-assets.zip';
      var thumbnail='./uploads/eparls/output/'+result[0].initiate_id+'/thumbnail.jpg';
      var thumbnailImg = '';
      if (fs.existsSync(thumbnail) &&  (fileExt=='epars' || fileExt=='eparls')) {
          thumbnailImg = configFile.getBaseUrl()+'eparls/output/'+result[0].initiate_id+'/thumbnail.jpg';
      }
      else if(fileType=='images' && result[0].s3_file_url!='')
      {
         let s3Urls=JSON.parse(result[0].s3_file_url);
         var thumbnailVideo=s3Urls;
         var thumbnailImg=thumbnailVideo[0];
        
      }
      else
      {
          var thumbnailVideo='./uploads/thumbnails/'+result[0].initiate_id+'-thumbnail_1.jpg';
          if (fs.existsSync(thumbnailVideo))
          {
            thumbnailImg = configFile.getBaseUrl()+'thumbnails/'+result[0].initiate_id+'-thumbnail_1.jpg';
          }
         //var scanImg = configFile.getBaseUrl()+'thumbnails/'+element.initiate_id+'-thumbnail_1.png';
      }

      var Upload='./uploads/eparls/output/'+result[0].initiate_id+'/arkit_video.mp4';
      if (fs.existsSync(Upload)) {
        
         var uploadVideo= configFile.getBaseUrl()+'eparls/output/'+result[0].initiate_id+'/arkit_video.mp4';
      }
      else
      {
        var uploadVideo = '';
      }
      var resObject='';
      if(result[0].s3_3d_url)
      {
         resObject=JSON.parse(result[0].s3_3d_url);
      }


      //https://recon-assets.s3.us-east-2.amazonaws.com/10973289/URC00000001.M4V
      //console.log('Path'+pathAsset);
      var resAssets='';
      if (result[0].s3_file_url && (fileExt=='epars' || fileExt=='eparls')) {
        resAss=JSON.parse(result[0].s3_file_url);

        if(resAss[0])
        {
          resAssets=resAss[0];
          // const thumbOutputPath = "./uploads/thumbnails/";
          // console.log(thumbOutputPath);
          // var fileThumbName='';
          // getThumbnailFromVideo(response,thumbOutputPath,initiateId).then(thumnailName => {
          //    fileThumbName = thumnailName
          //   console.log('File Thumbnail name is ',fileThumbName)
          // });
        }

      }
      else if(fs.existsSync(pathAsset))
      {
        resAssets=pathAsset;
      }
      
      let addData=moment(result[0].createdAt).format('DD-MM-YYYY h:mm:ss a');


      let task_request='';
      let target_distance_in_meters=0;
      let point_spacing_in_meters=0;
      let depth_map_maximum_depth=0;
      if(result[0].task_request)
      {
        task_request=JSON.parse(result[0].task_request);
        
        //console.log(point_spacing_in_meters);
        point_spacing_in_meters=task_request.scanSetting.point_spacing_in_meters?Math.round(task_request.scanSetting.point_spacing_in_meters*1000):0;
        target_distance_in_meters=task_request.scanSetting.target_distance_in_meters?task_request.scanSetting.target_distance_in_meters:0;
        depth_map_maximum_depth=task_request.scanSetting.depth_map_maximum_depth?task_request.scanSetting.depth_map_maximum_depth:'';
      }

      var type = '';
      if(fileType==='images' ) {
        type = 'Photogrammetry Photos';
      }
      else if (fileType==='video' && (fileExt=='eparls' || fileExt=='epars' )) {
        type = 'Lidar with Video Fusion';

      } else if (fileType==='video' ) { 
        type = 'Photogrammetry video';
      }

      /*
      if (result[0].s3_3d_url) {
        if (fs.existsSync(pathObject)) {
          resObject=BASE_URL+'downloads/'+result[0].initiate_id+'-objects.zip';
        }
        else
        {
          var url=BASE_URL+'api/v1/download3DObjects?userId=106&initiateId='+result[0].initiate_id
          await makeRequest(url).then(requestData => {
            console.log(requestData);
            resObject=requestData.data.path;
          }).catch(err => {
            return apiResponse.ErrorResponse(res, err);
          });
        }
        
      }*/
      
      res.render('collectdetail', { posts: req.session.name,collect_name:collect_name,collect_status:taskStatus,data: result, assetsurl: resAssets, threeDurl: resObject,addData:addData,BASE_URL:BASE_URL,ADMIN_BASE_URL:ADMIN_BASE_URL,thumbnailImg:thumbnailImg,uploadVideo:uploadVideo,fileExt:fileExt,fileType:fileType,thumbnailVideo:thumbnailVideo,point_spacing_in_meters:point_spacing_in_meters,target_distance_in_meters:target_distance_in_meters,depth_map_maximum_depth:depth_map_maximum_depth,collect_type: type});
    });
  }
]


//Collection details..
exports.collectdetail = [
  async function(req, res){
    utility.checkUserLogin(req, res);
    var assetsurl = [];
    var threeDurl = [];
    var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.file_type,t.file_ext,t.createdAt,u.first_name,u.last_name,u.email,t.createdAt,t.task_request FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.id=" + req.params.id + "";
    UserModel.sequelize.query(user_sql, { type: Sequelize.QueryTypes.SELECT }).then(async (result) => {
      var collect_name=result[0].collect_name;
      var status=result[0].internal_status;
      //Get priority Hostory..
      const getPriority = await PreCompleteTaskModel.findAll( {
        where: { initiate_id:result[0].initiate_id },order: [['id', 'DESC']]});
      let priorityHistory={};  
      if(getPriority.length>0)
      {
        priorityHistory=getPriority;
      }  
      
      var taskStatus=status== '0'? 'Incomplete':status == '1'? 'Processing':status == '2'?'Completed':status == '3'? 'Failed':status == '4'? 'Queued':'';
      //console.log(taskStatus);
      
      var fileExt=result[0].file_ext;
      var fileType=result[0].file_type;
      //var pathObject='./downloads/'+result[0].initiate_id+'-objects.zip';
      var pathAsset='./downloads/'+result[0].initiate_id+'-assets.zip';
      var thumbnail='./uploads/eparls/output/'+result[0].initiate_id+'/thumbnail.jpg';
      var thumbnailImg = '';
      if (fs.existsSync(thumbnail) &&  (fileExt=='epars' || fileExt=='eparls')) {
          thumbnailImg = configFile.getBaseUrl()+'eparls/output/'+result[0].initiate_id+'/thumbnail.jpg';
      }
      else if(fileType=='images' && result[0].s3_file_url!='')
      {
         let s3Urls=JSON.parse(result[0].s3_file_url);
         var thumbnailVideo=s3Urls;
         var thumbnailImg=thumbnailVideo[0];
        
      }
      else
      {
          var thumbnailVideo='./uploads/thumbnails/'+result[0].initiate_id+'-thumbnail_1.jpg';
          if (fs.existsSync(thumbnailVideo))
          {
            thumbnailImg = configFile.getBaseUrl()+'thumbnails/'+result[0].initiate_id+'-thumbnail_1.jpg';
          }
         //var scanImg = configFile.getBaseUrl()+'thumbnails/'+element.initiate_id+'-thumbnail_1.png';
      }

      var Upload='./uploads/eparls/output/'+result[0].initiate_id+'/arkit_video.mp4';
      if (fs.existsSync(Upload)) {
        
         var uploadVideo= configFile.getBaseUrl()+'eparls/output/'+result[0].initiate_id+'/arkit_video.mp4';
      }
      else
      {
        var uploadVideo = '';
      }
      var resObject='';
      if(result[0].s3_3d_url)
      {
         resObject=JSON.parse(result[0].s3_3d_url);
      }


      //https://recon-assets.s3.us-east-2.amazonaws.com/10973289/URC00000001.M4V
      //console.log('Path'+pathAsset);
      var resAssets='';
      if (result[0].s3_file_url && (fileExt=='epars' || fileExt=='eparls')) {
        resAss=JSON.parse(result[0].s3_file_url);

        if(resAss[0])
        {
          resAssets=resAss[0];
          // const thumbOutputPath = "./uploads/thumbnails/";
          // console.log(thumbOutputPath);
          // var fileThumbName='';
          // getThumbnailFromVideo(response,thumbOutputPath,initiateId).then(thumnailName => {
          //    fileThumbName = thumnailName
          //   console.log('File Thumbnail name is ',fileThumbName)
          // });
        }

      }
      else if(fs.existsSync(pathAsset))
      {
        resAssets=pathAsset;
      }
      
      let addData=moment(result[0].createdAt).format('DD-MM-YYYY h:mm:ss a');
      let task_request='';
      let target_distance_in_meters=0;
      let point_spacing_in_meters=0;
      let depth_map_maximum_depth=0;
      if(result[0].task_request)
      {
        task_request=JSON.parse(result[0].task_request);
        
        //console.log(point_spacing_in_meters);
        point_spacing_in_meters=task_request.scanSetting.point_spacing_in_meters?Math.round(task_request.scanSetting.point_spacing_in_meters*1000):0;
        target_distance_in_meters=task_request.scanSetting.target_distance_in_meters?task_request.scanSetting.target_distance_in_meters:0;
        depth_map_maximum_depth=task_request.scanSetting.depth_map_maximum_depth?task_request.scanSetting.depth_map_maximum_depth:0;
        point_density=task_request.scanSetting.point_density?task_request.scanSetting.point_density:0;
      }

      var type = ''; var fusion=''
      if(fileType==='images' ) {
        type = 'Photogrammetry';
        fusion= 'Photogrammetry';
      }
      else if (fileType==='video' && (fileExt=='eparls' || fileExt=='epars' )) {
        type = 'LiDAR Fusion';
        fusion= 'Lidar';
      } else if (fileType==='video' ) { 
        type = 'Photogrammetry video';
        fusion= 'Photogrammetry';
      }

     // console.log(depth_map_maximum_depth);
      
      /*
      if (result[0].s3_3d_url) {
        if (fs.existsSync(pathObject)) {
          resObject=BASE_URL+'downloads/'+result[0].initiate_id+'-objects.zip';
        }
        else
        {
          var url=BASE_URL+'api/v1/download3DObjects?userId=106&initiateId='+result[0].initiate_id
          await makeRequest(url).then(requestData => {
            console.log(requestData);
            resObject=requestData.data.path;
          }).catch(err => {
            return apiResponse.ErrorResponse(res, err);
          });
        }
        
      }*/
      
      res.render('collectdetail', { posts: req.session.name,collect_name:collect_name,collect_status:taskStatus,data: result, assetsurl: resAssets, threeDurl: resObject,addData:addData,BASE_URL:BASE_URL,ADMIN_BASE_URL:ADMIN_BASE_URL,thumbnailImg:thumbnailImg,uploadVideo:uploadVideo,fileExt:fileExt,fileType:fileType,point_spacing_in_meters:point_spacing_in_meters,target_distance_in_meters:target_distance_in_meters,depth_map_maximum_depth:depth_map_maximum_depth,point_density:point_density,collect_type: type,priorityHistory:priorityHistory,fusion:fusion,moment:moment});
    });
  }
]

exports.homedataOld = [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/login');
    }
    let search = req.body['search[value]'];
    var datesearch = '';
    var searchV = '';
    //Data serach filter date...
    if (req.body.is_date_search == "yes") {
      datesearch = "AND DATE(t.createdAt) BETWEEN '" + req.body.start_date + "' AND '" + req.body.end_date + "'";
    }
    //Data serch like...
    searchV = "AND( u.first_name like '%" + search + "%' || u.last_name like '%" + search + "%' || u.email like '%" + search + "%' || t.ep_collect_id like '%" + search + "%' || t.createdAt like '%" + search + "%')";
    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    let offset = parseInt(req.body.start);
    field = req.body['order[0][column]'];
    fieldName = req.body["columns[" + field + "][data]"];
    if (fieldName == "name") {
      fieldName = 'first_name';
    }
    if (fieldName == "status") {
      fieldName = 'internal_status';
    }
    await FileTaskModel.findAll().then(data => {
      data.forEach(element => {
        rowCount++;
      });
    });
    var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.file_ext,t.file_type,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id  where email!=''  " + searchV + " " + datesearch + " order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    var user_sqlCount = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id where email!=''  " + searchV + " " + datesearch;
    UserModel.sequelize.query(user_sql).then((result) => {
      UserModel.sequelize.query(user_sqlCount).then((resultC) => {
        let Tcount = resultC[0].length;
        let UserListAr = result[0].map((r) => {
          //image display
          var fileExt = r.file_ext;
          var fileType = r.file_type;
          var pathAsset = './downloads/' + r.initiate_id + '-assets.zip';
          var thumbnail = './uploads/eparls/output/' + r.initiate_id + '/thumbnail.jpg';
          var thumbnailImg = '';
          if (fs.existsSync(thumbnail) && (fileExt == 'epars' || fileExt == 'eparls')) {
            thumbnailImg = configFile.getBaseUrl() + 'eparls/output/' + r.initiate_id + '/thumbnail.jpg';
          }
          else if (fileType == 'images' && r.s3_file_url != '') {
            let s3Urls = JSON.parse(r.s3_file_url);
            var thumbnailVideo = s3Urls;
            var thumbnailImg = thumbnailVideo;
            if (thumbnailImg) {
              var thumbnailImg = thumbnailVideo[0];
            }
          } else {
            var thumbnailVideo = './uploads/thumbnails/' + r.initiate_id + '-thumbnail_1.jpg';
            if (fs.existsSync(thumbnailVideo)) {
              thumbnailImg = configFile.getBaseUrl() + 'thumbnails/' + r.initiate_id + '-thumbnail_1.jpg';
            }
          }
          //end
          var resObject = '';
          if (r.s3_3d_url) {
            var resobject = JSON.parse(r.s3_3d_url);
            var resObject = resobject[0].split('/').pop();
         }
          if (r.internal_status == 0 && r.ep_collect_id) {
            var es = '<td><div class="badge badge-warning"> Processing</div></td>';
          } else if (r.internal_status == 0) {
            var es = '<td><div class="badge badge-info">Initiated</div></td>';
          }
          else if (r.internal_status == 1) {
            var es = '<td><div class="badge badge-warning"> Processing</div></td>';
          }
          else if (r.internal_status == 3) {
            var es = '<td><div class="badge badge-danger">Failed</div></td>';
          }
          else {
            var es = '<td><div class="badge badge-success">Completed</div></td>';
          }
          // var assets = '<td><a href="/web/admin/collectdetail/' + r.id + '" class="badge badge-info">View</a></td>';
          if (thumbnailImg) {
            var thumbnailImg1 = '<td align="center" ><img src=' + thumbnailImg + ' style="height: 100px;"></td>'
          } else {
            thumbnailImg1 = "";
          }
          if (r.internal_status == 2 && resObject != "") {
            var assets = '<td><a href=' + resobject[0] + ' class="badge badge-dark" download>download</a></td>';
          } else {
            var assets = ''
          }
          var fullname = r.first_name
          if (r.last_name != '' && r.last_name != null) {
            fullname = r.first_name + ' ' + r.last_name;
          }
          var invoiceData =
          {
            id: r.id,
            thumbnailImg: thumbnailImg1,
            initiate_id: r.initiate_id,
            ep_collect_id: r.ep_collect_id,
            collect_name: r.collect_name ? r.collect_name : '',
            user_id: r.user_id,
            s3_file_url: assets,
            s3_3d_url: r.s3_3d_url,
            name: fullname,
            //add_date
            email: r.email,
            createdAt: moment(r.createdAt).format('DD-MM-YYYY h:mm:ss'),
            status: es,
            assets: assets,
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


exports.homedata04 = [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/login');
    }
    let search = req.body['search[value]'];
    var datesearch = '';
    var searchV = '';
    var searchJob = '';
    var searchFileType = '';
    //Data serach filter date...
    if (req.body.is_date_search == "yes") {
      datesearch= "AND DATE(t.createdAt) BETWEEN '" + req.body.start_date + "' AND '" + req.body.end_date + "'";
    }
    if(req.body.job_status)
    {
      searchJob= "AND t.internal_status ="+req.body.job_status;
    }
    if(req.body.file_type)
    {
      if(req.body.file_type==2)
      {
        searchFileType= "AND (t.file_ext='eparls' || t.file_ext='epars')";
      }
      else
      {
        searchFileType= "AND (t.file_ext!='eparls' and  t.file_ext!='epars')";
      }
      //searchJob= "AND t.internal_status ="+req.body.job_status;
    }
   // console.log('searchFileType',searchFileType);
    //Data serch like...
    searchV = "AND( u.first_name like '%" + search + "%' || u.last_name like '%" + search + "%' || u.email like '%" + search + "%' || t.ep_collect_id like '%" + search + "%' || t.createdAt like '%" + search + "%')";
    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    let offset = parseInt(req.body.start);
    field = req.body['order[0][column]'];
    fieldName = req.body["columns[" + field + "][data]"];
    if (fieldName == "name") {
      fieldName = 'first_name';
    }
    if (fieldName == "status") {
      fieldName = 'internal_status';
    }
    await FileTaskModel.findAll().then(data => {
      data.forEach(element => {
        rowCount++;
      });
    });
    var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.file_ext,t.file_type,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email,u.job_priority FROM file_tasks t  JOIN app_users u on u.id=t.user_id  where email!=''  " + searchV + " " + datesearch + " " + searchJob + " " + searchFileType + "  order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    console.log(user_sql);
    var user_sqlCount = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id where email!=''  " + searchV + " " + datesearch+ " "+searchJob+ " " +searchFileType;
    UserModel.sequelize.query(user_sql).then((result) => {
      UserModel.sequelize.query(user_sqlCount).then((resultC) => {
        let Tcount = resultC[0].length;
        let UserListAr = result[0].map((r) => {
          //image display
          var fileExt = r.file_ext;
          var fileType = r.file_type;
          var pathAsset = './downloads/' + r.initiate_id + '-assets.zip';
          var thumbnail = './uploads/eparls/output/' + r.initiate_id + '/thumbnail.jpg';
          var thumbnailImg = '';
          if (fs.existsSync(thumbnail) && (fileExt == 'epars' || fileExt == 'eparls')) {
            thumbnailImg = configFile.getBaseUrl() + 'eparls/output/' + r.initiate_id + '/thumbnail.jpg';
          }
          else if (fileType == 'images' && r.s3_file_url != '') {
            let s3Urls = JSON.parse(r.s3_file_url);
            var thumbnailVideo = s3Urls;
            var thumbnailImg = thumbnailVideo;
            if (thumbnailImg) {
              var thumbnailImg = thumbnailVideo[0];
            }
          } else {
            var thumbnailVideo = './uploads/thumbnails/' + r.initiate_id + '-thumbnail_1.jpg';
            if (fs.existsSync(thumbnailVideo)) {
              thumbnailImg = configFile.getBaseUrl() + 'thumbnails/' + r.initiate_id + '-thumbnail_1.jpg';
            }
          }
          //end
          var resObject = '';
          if (r.s3_3d_url) {
            var resobject = JSON.parse(r.s3_3d_url);
            var resObject = resobject[0].split('/').pop();
         }
          if (r.internal_status == 0 && r.ep_collect_id) {
            var es = '<td><div class="badge badge-info">Initiated</div></td>';
          } else if (r.internal_status == 0) {
            var es = '<td><div class="badge badge-info">Initiated</div></td>';
          }
          else if (r.internal_status == 1) {
            var es = '<td><div class="badge badge-warning"> Processing</div></td>';
          }
          else if (r.internal_status == 3) {
            var es = '<td><div class="badge badge-danger">Failed</div></td>';
          }
          else {
            var es = '<td><div class="badge badge-success">Completed</div></td>';
          }
          // var assets = '<td><a href="/web/admin/collectdetail/' + r.id + '" class="badge badge-info">View</a></td>';
          if (thumbnailImg) {
            var thumbnailImg1 = '<td align="center" ><img src=' + thumbnailImg + ' style="height: 100px;"></td>'
          } else {
            thumbnailImg1 = "";
          }
          if (r.internal_status == 2 && resObject != "") {
            var assets = '<td><a href=' + resobject[0] + ' class="badge badge-dark" download>download</a></td>';
          } else {
            var assets = ''
          }
          var fullname = r.first_name
          if (r.last_name != '' && r.last_name != null) {
            fullname = r.first_name + ' ' + r.last_name;
          }
          var invoiceData =
          {
            id: r.id,
            thumbnailImg: thumbnailImg1,
            initiate_id: r.initiate_id,
            ep_collect_id: r.ep_collect_id,
            collect_name: r.collect_name ? r.collect_name : '',
            user_id: r.user_id,
            s3_file_url: assets,
            s3_3d_url: r.s3_3d_url,
            name: fullname,
            //add_date
            email: r.email,
            createdAt: moment(r.createdAt).format('DD-MM-YYYY h:mm:ss'),
            status: es,
            assets: assets,
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


exports.homedata = [
  async (req, res) => {
    if (!utility.checkUserLogin(req, res)) {
      res.redirect('/login');
    }
    let search = req.body['search[value]'];
    var datesearch = '';
    var searchV = '';
    var searchJob = '';
    var searchFileType = '';
    //Data serach filter date...
    if (req.body.is_date_search == "yes") {
      datesearch= "AND DATE(t.createdAt) BETWEEN '" + req.body.start_date + "' AND '" + req.body.end_date + "'";
    }
    if(req.body.job_status)
    {
      searchJob= "AND t.internal_status ="+req.body.job_status;
    }
    if(req.body.file_type)
    {
      if(req.body.file_type==2)
      {
        searchFileType= "AND (t.file_ext='eparls' || t.file_ext='epars')";
      }
      else
      {
        searchFileType= "AND (t.file_ext!='eparls' and  t.file_ext!='epars')";
      }
      //searchJob= "AND t.internal_status ="+req.body.job_status;
    }
   // console.log('searchFileType',searchFileType);
    //Data serch like...
    searchV = "AND( u.first_name like '%" + search + "%' || u.last_name like '%" + search + "%' || u.email like '%" + search + "%' || t.ep_collect_id like '%" + search + "%' || t.createdAt like '%" + search + "%' || t.collect_name like '%" + search + "%')";
    let limit = parseInt(req.body.length);
    let draw = req.body.draw;
    let rowCount = 0;
    let offset = parseInt(req.body.start);
    field = req.body['order[0][column]'];
    fieldName = req.body["columns[" + field + "][data]"];
    if (fieldName == "name") {
      fieldName = 'first_name';
    }
    if (fieldName == "status") {
      fieldName = 'internal_status';
    }
    await FileTaskModel.findAll().then(data => {
      data.forEach(element => {
        rowCount++;
      });
    });
    var user_sql = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.collect_name,t.file_ext,t.file_type,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email,u.job_priority,(select process_priority from pre_complete_tasks where initiate_id=t.initiate_id ORDER by id desc LIMIT 1) as process_priority,(select process_date from pre_complete_tasks where initiate_id=t.initiate_id and reprocess=0 ORDER by id desc LIMIT 1) as process_date,(select complete_date from pre_complete_tasks where initiate_id=t.initiate_id and reprocess=0 ORDER by id desc LIMIT 1) as complete_date FROM file_tasks t  JOIN app_users u on u.id=t.user_id  where email!=''  " + searchV + " " + datesearch + " " + searchJob + " " + searchFileType + "  order by " + fieldName + " " + req.body['order[0][dir]'] + " LIMIT " + limit + " OFFSET " + offset;
    console.log(user_sql);
    var user_sqlCount = "SELECT t.id,t.initiate_id,t.ep_collect_id,t.user_id,t.s3_file_url,t.s3_3d_url,t.internal_status,t.createdAt,u.first_name,u.last_name,u.email FROM file_tasks t  JOIN app_users u on u.id=t.user_id where email!=''   " + searchV + " " + datesearch+ " "+searchJob+ " " +searchFileType;
    UserModel.sequelize.query(user_sql).then((result) => {
      UserModel.sequelize.query(user_sqlCount).then((resultC) => {
        let Tcount = resultC[0].length;
        let UserListAr = result[0].map((r) => {
          //image display
          var fileExt = r.file_ext;
          var fileType = r.file_type;
          var pathAsset = './downloads/' + r.initiate_id + '-assets.zip';
          var thumbnail = './uploads/eparls/output/' + r.initiate_id + '/thumbnail.jpg';
          var thumbnailImg = '';
          if (fs.existsSync(thumbnail) && (fileExt == 'epars' || fileExt == 'eparls')) {
            thumbnailImg = configFile.getBaseUrl() + 'eparls/output/' + r.initiate_id + '/thumbnail.jpg';
          }
          else if (fileType == 'images' && r.s3_file_url != '') {
            let s3Urls = JSON.parse(r.s3_file_url);
            var thumbnailVideo = s3Urls;
            var thumbnailImg = thumbnailVideo;
            if (thumbnailImg) {
              var thumbnailImg = thumbnailVideo[0];
            }
          } else {
            var thumbnailVideo = './uploads/thumbnails/' + r.initiate_id + '-thumbnail_1.jpg';
            if (fs.existsSync(thumbnailVideo)) {
              thumbnailImg = configFile.getBaseUrl() + 'thumbnails/' + r.initiate_id + '-thumbnail_1.jpg';
            }
          }
          //end
          var resObject = '';
          if (r.s3_3d_url) {
            var resobject = JSON.parse(r.s3_3d_url);
            var resObject = resobject[0].split('/').pop();
         }
          if (r.internal_status == 0 ) {
            var es = '<td><div class="badge badge-info"> Initiated</div></td>';
          } else if (r.internal_status == 4) {
            var es = '<td><div class="badge badge-info">Queued</div></td>';
          }
          else if (r.internal_status == 1) {
            var es = '<td><div class="badge badge-warning"> Processing</div></td>';
          }
          else if (r.internal_status == 3) {
            var es = '<td><div class="badge badge-danger">Failed</div></td>';
          }
          else {
            var es = '<td><div class="badge badge-success">Completed</div></td>';
          }
          // var assets = '<td><a href="/web/admin/collectdetail/' + r.id + '" class="badge badge-info">View</a></td>';
          if (thumbnailImg) {
            var thumbnailImg1 = '<td align="center" ><img src=' + thumbnailImg + ' style="height: 100px;"></td>'
          } else {
            thumbnailImg1 = "";
          }
          if (r.internal_status == 2 && resObject != "") {
            var assets = '<td><a href=' + resobject[0] + ' class="badge badge-dark" download>download</a></td>';
          } else {
            var assets = ''
          }
          var fullname = r.first_name
          if (r.last_name != '' && r.last_name != null) {
            fullname = r.first_name + ' ' + r.last_name;
          }

          var difftm='';
          if(r.complete_date)
          {


             dt1 = new Date(r.process_date);
             dt2 = new Date(r.complete_date);
             difftm=diff_minutes(dt1, dt2)+ ' minute';
          //  var beginningTime = moment(r.complete_date);
            //var endTime = moment(r.createdAt);
            // difftm = beginningTime.diff(endTime, 'mm');
            
          }
          var invoiceData =
          {
            id: r.id,
            thumbnailImg: thumbnailImg1,
            initiate_id: r.initiate_id,
            ep_collect_id: r.ep_collect_id,
            collect_name: r.collect_name ? r.collect_name : '',
            user_id: r.user_id,
            s3_file_url: assets,
            s3_3d_url: r.s3_3d_url,
            name: fullname,
            process_priority:r.process_priority,
            processing_time:difftm,
            //add_date
            email: r.email,
            createdAt: moment(r.createdAt).format('DD-MM-YYYY h:mm:ss'),
            status: es,
            assets: assets,
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


function diff_minutes(dt2, dt1) 
 {

  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
  
 }



//Gettig Email tamplate...
exports.resetPasswordEmail = [
  async (req, res) => {
    if (req.params.email) {
      var email = req.params.email;
      UserModel.findOne({ where: { email: email } }).then((user) => {
        EmailTamplateModel.findOne({ where: { id: '1' } }).then((tamplate) => {
          var tamplate = tamplate.content;
          var generatedPassword = utility.generatePassword();
          bcrypt.hash(generatedPassword, 10, function (err, hash) {
            let updateData = { ref_password: generatedPassword, password: hash }
            UserModel.update(updateData, { where: { email: email } }).then(data => {
              console.log(data);
              tamplate = tamplate.replace('Username', user.first_name + ' ' + user.last_name);
              var link = `${PORTAL_BASE_URL}reset-password?username=${user.email}&password=${generatedPassword}`;
              tamplate = tamplate.replace('forgate_link', link);
              console.log(tamplate);
              mailer.send(
                constants.confirmEmails.from,
                email,
                //"zunedgkp@gmail.com",
                "Link for Reset Password",
                tamplate
              ).then(function () {
                let updateData = { is_password_change: 0 }
                UserModel.update(updateData, { where: { email: email } }).then(data => {
                  return apiResponse.successResponse(res, "Password has been changed and password sent in user email.");
                }).catch(err => {
                  return apiResponse.ErrorResponse(res, err);
                });
              }).catch(err => {
                return apiResponse.ErrorResponse(res, err);
              });
            }).catch(err => {
              return apiResponse.ErrorResponse(res, err);
            });
          });
        }).catch(err => {
          return apiResponse.ErrorResponse(res, err);
        });
      }).catch(err => {
        return apiResponse.ErrorResponse(res, err);
      });
    }
    else {
    }
  }
]

//Send Email
exports.SendEmail = [
  async (req, res) => {
    if (req.params.email) {
      var email = req.params.email;
      var user_sql = "SELECT t.ep_collect_id,t.initiate_id,t.collect_name,t.collect_notes,t.src_type,u.user_firebase_id,u.email,u.first_name,u.last_name FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.initiate_id='" + email + "' ";
      UserModel.sequelize.query(user_sql).then((user) => {


        let UserListAr = user[0].map((r) => {
          collect_name = r.collect_name ? r.collect_name : '';
          collect_notes = r.collect_notes ? r.collect_notes : '';
          src_type = r.src_type ? r.src_type : '';
          collect_id = r.ep_collect_id ? r.ep_collect_id : '';
          initiate_id = r.initiate_id;
          user_id = r.id;
          user_email = r.email,
          first_name=r.first_name,
          last_name=r.last_name,
          firebase_id = r.user_firebase_id ? r.user_firebase_id : '';
         
        });

        var title = 'Reupload Collection';
        var data = {
          initiate_id: initiate_id,
         // collect_id: collect_id,
          collect_name: collect_name,

        };
        //var firebase_id=r.user_firebase_id;
        
        notificationUtility.sentNotificationSingle(firebase_id,title,data);
        rimraf("./uploads/3d-requests/"+initiate_id, function () { console.log("Delete Folder done"); });
        EmailTamplateModel.findOne({ where: { id: '4' } }).then((tamplate) => {
          var tamplate = tamplate.content;
            tamplate = tamplate.replace('title', "Please Reupload Your Task");
            tamplate = tamplate.replace('Username',first_name + ' ' +  last_name);
            tamplate = tamplate.replace('Firstcontent', "Your Collect Name: " + collect_name + "<br>");
       
        FileTaskModel.update({reupload:'2',internal_status:'0'},{where: {initiate_id: initiate_id}}).then(updatedData => {
        });
       //let html = "Your Collect Name: " + collect_name + "<br>" + "Collect Notes: " + collect_notes + "<br>";
        mailer.send(
          constants.confirmEmails.from,
          user_email,
          //"zunedgkp@gmail.com",
          "Please Reupload Your Task",
          tamplate
        ).then(function () {
          return apiResponse.successResponse(res, "Email send successfully.");
        }).catch(err => {
          return apiResponse.ErrorResponse(res, err);
        });
      }).catch(err => {
        return apiResponse.ErrorResponse(res, err);
      });
    });
    }
    else {
    }
  }
]

exports.deleteObjects= [
  (req, res) => {
      // Validate fields.
      body("initiateId").isLength({ min: 1 }).trim().withMessage("Initiate id must be specified.")
      try {
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
              return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
              //return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
          }else {
              //console.log(req.body.initiateId);
              FileTaskModel.destroy({where:{initiate_id:req.params.initiateid}}).then(collect => {
              });
              return apiResponse.successResponseWithData(res,"Deleted Successfully.");
          }
      } catch (err) {
          return apiResponse.ErrorResponse(res, err);
      }
  }
];

//Send Email for reminder
exports.reminderemail = [
  async (req, res) => {
    if (req.params.email) {
      var email = req.params.email;
      var user_sql = "SELECT t.ep_collect_id,t.initiate_id,t.collect_name,t.collect_notes,t.src_type,u.user_firebase_id,u.email,u.first_name,u.last_name,t.s3_3d_url,t.internal_status FROM file_tasks t  JOIN app_users u on u.id=t.user_id where t.initiate_id='" + email + "' ";
      UserModel.sequelize.query(user_sql, {type: Sequelize.QueryTypes.SELECT}).then((result) => {
         console.log(result);
       if(result[0].internal_status==2)
       {
        
        EmailTamplateModel.findOne({ where: { id: '3' }}).then((tamplate) => {
          //console.log("aaaaaaaaaaaaaaaq1111111111111111111",result[0].first_name);
            var tamplate = tamplate.content;
            
            tamplate = tamplate.replace('Username', result[0].first_name + ' ' + result[0].last_name);
            var html='';
             
                let link1='';
                let link2='';
                var responseData=JSON.parse(result[0].s3_3d_url);
               // console.log('First',responseData[0]);
               // console.log('Last',responseData[1]);
                if(responseData[0])
                {
                  link1="<a href="+responseData[0]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud (E57)</a><br>";
                }
                if(responseData[1])
                {
                 // link2="<a href="+responseData[1]+" target='_blank' rel='noreferrer'>Click here to Download Point Cloud (E57)</a><br>";
                }
                  html = "Your Collect Name: " +result[0].collect_name + "<br>" + link1+link2;
                  var title='Recon-3D | Your data is ready!';
                 //Notification
                  var firebase_id=result[0].user_firebase_id;
                  var data={
                  initiate_id:result[0].initiate_id,
                  //collect_id:result[0].ep_collect_id,
                  collect_name:result[0].collect_name,
                  };
                  notificationUtility.sentNotificationSingle(firebase_id,title,data);
              
                  tamplate = tamplate.replace('Download_label','You can also download your data at the link below:');
                                     
                  tamplate = tamplate.replace('Content',html);
                   //console.log(tamplate);
                  //let html = "Your File Successfully Uploaded";
         
                  mailer.send(
                    constants.confirmEmails.from,
                  //result.email,
                     result[0].email,
                    //"zunedgkp@gmail.com",
                    title,
                    tamplate
                  ).then(function () {
                    console.log('firrr',result[0].user_firebase_id);
                    
                    return apiResponse.successResponse(res, "Email send Successfully.");
                  }).catch(err => {
                    return apiResponse.ErrorResponse(res, err);
                  });
                 
          
         }).catch(err => {
          return apiResponse.ErrorResponse(res, err);
         });
       }
       else
       {
        EmailTamplateModel.findOne({ where: { id: '5' }}).then((tamplate) => {
          //console.log("aaaaaaaaaaaaaaaq1111111111111111111",result[0].first_name);
            var tamplate = tamplate.content;
            var fullname=result[0].first_name
            if(result[0].last_name!='' && result[0].last_name!=null)
            {
              fullname=result[0].first_name+' '+result[0].last_name;
            }
            
            tamplate = tamplate.replace('Username',fullname);
            //tamplate = tamplate.replace('Username', result[0].first_name + ' ' + result[0].last_name);
            var html='';
             
                let link1='';
                let link2='';
                var responseData=JSON.parse(result[0].s3_3d_url);
               // console.log('First',responseData[0]);
               // console.log('Last',responseData[1]);
               var html='';
               var title='Processing failed';
                var firebase_id=result[0].user_firebase_id;
                var data={
                initiate_id:result[0].initiate_id,
                //collect_id:result[0].ep_collect_id,
                collect_name:result[0].collect_name,
                };
                notificationUtility.sentNotificationSingle(firebase_id,title,data);
                if(req.body.data)
                {
                  let link1='';
                  let link2='';
                  
                    html = "Your Collect Name: " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>" + link1+link2;
                  var title='Recon-3D | Your Data Processing Failed!';
                }
                else
                {
                  html = "Your uploading failed  : " + collect.collect_name + "<br>" + "Collect Notes: " + collect.collect_notes + "<br>";
                  var title='Recon-3D | Your Data Processing Failed';
                }
                    //html ="Your upload for scan " + collect.collect_name + " has failed. We couldn’t get the complete data at our end and hence your scan cannot be processed."+"<br><br>"+"<br>"+"";
                  html ="Our system couldn’t successfully generate a 3D model from your scan "+'"'+collect.collect_name+'"'+". We request you to try scanning again.<br>";
                var tamplate=tamplate.content;
              
              //console.log('Html',html);
                   tamplate = tamplate.replace('Content',html);
                   //console.log(tamplate);
                  //let html = "Your File Successfully Uploaded";
         
                  mailer.send(
                    constants.confirmEmails.from,
                  //result.email,
                     result[0].email,
                    //"zunedgkp@gmail.com",
                    title,
                    tamplate
                  ).then(function () {
                    return apiResponse.successResponse(res, "Email send Successfully.");
                  }).catch(err => {
                    return apiResponse.ErrorResponse(res, err);
                  });
          // if(result[0].user_firebase_id)
          // {
          //    var firebase_id=result[0].user_firebase_id;
          //  var title='Your Data is ready';
          //   var data={
          //   initiate_id:result[0].initiate_id?result[0].initiate_id:'',
          //   collect_id:result[0].collect_id?result[0].collect_id:'',
          //   collect_name:result[0].collect_name?result[0].collect_name:''
  
          //   };
            
          //   if(firebase_id)
          //   {
          //     var result = notificationUtility.sentNotificationSingle(firebase_id,title,data);
          //   } 
          // }
          
         }).catch(err => {
          return apiResponse.ErrorResponse(res, err);
         });
       } 
      
    }).catch(err => {
      return apiResponse.ErrorResponse(res, err);
    });
    }
    else {
    }
  }
]

exports.profile = [
  (req, res) => {
     UserModel.findOne({ where: { ref_password: req.query.password } }).then(reg_user => {
    if (reg_user) {
        res.render('profile', { posts: req.session.name, username: req.query.username, password: req.query.password });
      }
      res.render('invalid');
    });
  }

]
exports.invalid = [
  (req, res) => {
    res.render('invalid');

  }

]


exports.resetPassword = [
 (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      }
      else {
        if (req.body.password == req.body.confirmPassword) {
          bcrypt.hash(req.body.password, 10, function (err, hash) {
            UserModel.findOne({ where: { email: req.body.email } }).then(reg_user1 => {
              if (reg_user1) {
                let updateData = { password: hash, is_password_change: 1, ref_password: req.body.password }
                UserModel.update(updateData, { where: { email: req.body.email } }).then(data => {
                  return apiResponse.successResponseWithData(res, "Password has been changed.");
                }).catch(err => {
                  return apiResponse.ErrorResponse(res, err);
                });
              }
              else {
                return apiResponse.notFoundResponse(res, "Invalid Email.");
              }
            });
          })
        }
        else {
          return apiResponse.successResponse(res, "Password and Confirm Password are not match.");
        }
      }
    }
    catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  }
];


exports.profileUpdate = [
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      } else {

        var queryTask = { first_name: req.body.first_name, last_name: req.body.last_name, user_mobile: req.body.user_mobile, orgnization_name: req.body.orgnization_name,job_priority:req.body.job_priority};
        UserModel.update(queryTask, {
          where: { id: req.body.id }
        }).catch(err => {
          return apiResponse.ErrorResponse(res, err);
        });
        return apiResponse.successResponseWithData(res, "Updated successfully.");
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error)
    }
  }
]

exports.updateEmail = [
  async (req, res) => {
    try {
      UserModel.findOne({ where: { email: req.body.email } }).then(data => {
        if (data) {
          let updateDataStatus = { user_status: '2', user_deleted_email: data.email, email: "" }
          // console.log("data.email", data.email);
          UserModel.update(updateDataStatus, { where: { email: req.body.email } }).then(updateData => {
            return apiResponse.successResponseWithData(res, "Deleted successfully.");
          })
        }
        else {
          return apiResponse.notFoundResponse(res, "Email Not Found");
        }
      }).catch(err => {
        return apiResponse.ErrorResponse(res, err);
      });
    } catch (error) {
      return apiResponse.ErrorResponse(res, error)
    }
  }
];

exports.resetPasswordBYAdmin = [
 (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      }
      else {

        if (req.query.password) {
          bcrypt.hash(req.query.password, 10, function (err, hash) {
            UserModel.findOne({ where: { email: req.query.email } }).then(reg_user1 => {
              if (reg_user1) {
                let updateData = { password: hash, is_password_change: 1, ref_password: req.query.password }
                UserModel.update(updateData, { where: { email: req.query.email } }).then(data => {
                  return apiResponse.successResponseWithData(res, "Password has been changed.");
                }).catch(err => {
                  return apiResponse.ErrorResponse(res, err);
                });
              }
              else {
                return apiResponse.notFoundResponse(res, "Invalid Email.");
              }
            });
          })
        }
        else {
          return apiResponse.successResponse(res, "Password1 and Confirm Password are not match.");
        }
      }
    }
    catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

exports.resetSuscriptionBYAdmin = [
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      }
      else {
        console.log("req.query.subscribe", req.query.subscribe);
        if (req.query.subscribe) {
          UserModel.findOne({ where: { email: req.query.email } }).then(reg_user1 => {
            
            if (reg_user1) {
              let oneM=moment().add(1, 'months').format('YYYY-MM-DD HH:mm:ss');
              let oneY=moment().add(12, 'months').format('YYYY-MM-DD HH:mm:ss');

              var product_id=''; var endDate='';
              if (req.query.subscribed == "com.Recon3d.OneYearPack") {
                endDate = oneM;
                product_id='com.Recon3d.OneYearPack';
              }
              else if (req.query.subscribed == "com.Recon3D.StandardOneMonthPack") {
                endDate = oneY;
                product_id='com.Recon3D.StandardOneMonthPack';
              }
              let today = moment().format('YYYY-MM-DD HH:mm:ss');
             
              let update = { from_date: today, to_date: endDate,product_id:product_id,payment_status:'SUCCESS',source:'Admin' }
              console.log("reg_user1.id", reg_user1.id);
              
              const user =
              {
                user_id: reg_user1.id
              }
                PaymentModel.findOrCreate({ where: user, defaults: user }).then(details => {
                  console.log("details", details);
                PaymentModel.update(update, { where: user }).then(data => {
                  UserModel.update({is_subscribe:1}, { where: { id: reg_user1.id } }).then(data => {
                  }).catch(err => {
                    console.log("err", err);
                    //return apiResponse.ErrorResponse(res, err);
                  });
                  console.log("update", update);
                  console.log("data", data);
                  return apiResponse.successResponseWithData(res, "Subscription activated.");
                }).catch(err => {
                  console.log("err", err);
                  return apiResponse.ErrorResponse(res, err);
                });
              })
            
            }
            else {
              return apiResponse.notFoundResponse(res, "Invalid Email.");
            }
          });

        }
        else {
          return apiResponse.successResponse(res, "Password1 and Confirm Password are not match.");
        }
      }
    }
    catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  }
];
exports.resetSuscriptionBYAdminOld = [
 (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      }
      else {

        if (req.query.subscribe) {
         
            UserModel.findOne({ where: { email: req.query.email } }).then(reg_user1 => {
              if (reg_user1) {
                let updateData = { is_subscribe:req.query.subscribe}
                UserModel.update(updateData, { where: { email: req.query.email } }).then(data => {
                  return apiResponse.successResponseWithData(res, "Subscription has been changed.");
                }).catch(err => {
                  return apiResponse.ErrorResponse(res, err);
                });
              }
              else {
                return apiResponse.notFoundResponse(res, "Invalid Email.");
              }
            });
          
        }
        else {
          return apiResponse.successResponse(res, "Password1 and Confirm Password are not match.");
        }
      }
    }
    catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

exports.subscribedUser = [
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
      } else {

        var subscribe_starts = req.body.subscribe_starts;
        console.log("subscribe_starts", subscribe_starts);
        var subscribe_ends = req.body.subscribe_ends;

        if (subscribe_starts >= subscribe_ends) {
          return apiResponse.notFoundResponse(res, "start date can not be greater than or equal to the end date");
        }
        else {
          var queryTask = {subscribe_starts, subscribe_ends ,is_subscribe:2};
          UserModel.update(queryTask, { where: { id: req.body.id } }).then(updatedData => {
            console.log("queryTask", queryTask);
            console.log("updatedData", updatedData);
          }).catch(Error => {
            console.log('Submission failed', Error)
          });
          return apiResponse.successResponseWithData(res, "Submitted successfully.");
        }
      }
    } catch (error) {
      return apiResponse.ErrorResponse(res, error)
    }
  }
]


/*
const getThumbnailFromVideo = async (inputPath,outputPath,initiateId=null) =>
{
  return new Promise((resolve, reject) => {
    var createThumb = new ffmpeg(inputPath);
    createThumb.then(function (video) {
      video.fnExtractFrameToJPG(outputPath, {
        frame_rate : 1,
        number : 1,
        //size : 1080,
        file_name : initiateId+'-thumbnail'
      }, function (error, files) {
        reject('Video Object' + error)
        if (!error)
        resolve('Generated Frame: ' + files);
      });
    }, function (err) {
      reject('Error From Thumbnail: ' + err);
    });
  })
};
*/
