const db = require("../models");
const {TermsModel: TermsModel, PrivacyPolicyModel: PrivacyPolicyModel, EmailsupportModel: EmailsupportModel, FaqsModel: FaqsModel, TutorialsModel: TutorialsModel,AppLogModel:AppLogModel,EmailTamplateModel:EmailTamplateModel } = db;
const Op = db.Sequelize.Op;
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
var configFile = require('../config/configFile');
const { constants } = require("../helpers/constants");
const uploadFile = require("../middlewares/logUpload");
const uploadLogFile = require("../middlewares/appLogUpload");
var videoPath = configFile.getBaseUrl() + constants.path.tutorialViewPath;
const mailer = require("../helpers/mailer");
console.log(videoPath);
exports.getPagesData = [
  function (req, res) {
    try {
      if (req.query.pageType) {
        if (req.query.pageType == 'terms') {
          TermsModel.findAll({ attributes: ['id', 'content'] }).then(function (terms) {
            let termsAr = terms.map((r) => {
              return apiResponse.successResponseWithData(res, "Terms & Condition.", r.dataValues);
            });
          });
        }
        else if (req.query.pageType == 'faqs') {
          FaqsModel.findAll({ attributes: ['id', 'question', 'answer'] }).then(function (data) {
            return apiResponse.successResponseWithData(res, "FAQS.", data);
          });
        }
        else if (req.query.pageType == 'privacyPolicy') {
          PrivacyPolicyModel.findAll({ attributes: ['id', 'content'] }).then(function (data) {
            let resAr = data.map((r) => {
              return apiResponse.successResponseWithData(res, "Privacy Policy.", r.dataValues);
            });
          });
        }
      }
      else {
        return apiResponse.ErrorResponse(res, err);
      }
    }
     catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  }
];
exports.emailsupportOld= [
  
  function (req, res) {
    try {
      EmailsupportModel.create({ full_name: req.body.full_name, email: req.body.email, description: req.body.description }).then(data => {
        return apiResponse.successResponseWithData(res, "Successfully added", data);
      });
    }
    catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

exports.emailsupport = async (req, res) => {
    try
    {
        console.log('reefffbbbb',req.body);
       
            uploadResult = await uploadFile(req, res);
            //   console.log(uploadResult);
            const uploadedFile = uploadResult;
            const { body,userId } = uploadResult;
            fileP=uploadedFile.file.filename;
       
        
        var fileSave='';
        
        let EmailSupData = 
            {
                 full_name:req.body.full_name?req.body.full_name:'',
                 email:req.body.email?req.body.email:'',
                 userId:req.body.userId?req.body.userId:'',
                 description:req.body.description?req.body.description:'',
                 support_file:fileP?fileP:''

            }
            EmailsupportModel.create(EmailSupData).then(data => {
                return apiResponse.successResponseWithData(res, "Thank you for contacting Recon 3D. Our team will get back to you shortly.", data);
            }).catch(err => {
                console.log(err);
                //return apiResponse.ErrorResponse(res, err);
            });
        
       
           
      
    }
    catch (err)
    {
      if(err.code == "LIMIT_FILE_SIZE")
      {
          return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
      }
      else
      {
          return apiResponse.ErrorResponse(res, `Could not upload the file: ${err}`);       
      }
    }
};


exports.appLog = async (req, res) => {
    try
    {
        console.log('reefffbbbb',req.body);
       
            uploadResult = await uploadLogFile(req, res);
            //   console.log(uploadResult);
            const uploadedFile = uploadResult;
            const { body,user_id } = uploadResult;
            fileP=uploadedFile.file.filename;
       
        
        var fileSave='';
        
        let EmailSupData = 
            {
                 full_name:req.body.full_name?req.body.full_name:'',
                 email:req.body.email?req.body.email:'',
                 user_id:req.body.user_id?req.body.user_id:'',
                 description:req.body.description?req.body.description:'',
                 logFile:fileP?fileP:''

            }

            console.log(EmailSupData);
           AppLogModel.create(EmailSupData).then(data => {
                EmailTamplateModel.findOne({where: { id: '6'} }).then((tamplate) => {
                    var tamplate=tamplate.content; 
                    tamplate = tamplate.replace('Username',req.body.full_name); 
                    tamplate = tamplate.replace('email',req.body.email); 
                    tamplate = tamplate.replace('userId',req.body.userId); 
                    tamplate = tamplate.replace('content',req.body.description); 
                    mailer.send(
                    'zunedgkp@gmail.com',    
                    'zunedgkp@gmail.com', 
                   
                    "Email Support",
                    tamplate
                    ).then(function() {
                      console.log('Email send');
                    }).catch(err => {
                      console.log(err);
                    //return apiResponse.ErrorResponse(res, err.);
                    });
                });
                return apiResponse.successResponseWithData(res, "Thank you for contacting Recon 3D. Our team will get back to you shortly.", data);
            }).catch(err => {
                console.log(err);
                //return apiResponse.ErrorResponse(res, err);
            });
        
       
           
      
    }
    catch (err)
    {
      if(err.code == "LIMIT_FILE_SIZE")
      {
          return apiResponse.ErrorResponse(res, 'File size cannot be larger than 2MB!');
      }
      else
      {
          return apiResponse.ErrorResponse(res, `Could not upload the file: ${err}`);       
      }
    }
};

exports.tutorial = [
  async (req, res) => {
    var finalArray = [];
    console.log(videoPath);
    await TutorialsModel.findAll({}).then(async (data) => {
      if (data.length > 0) {
        data.forEach((element, index) => {
          var tutorial = {
            'id': element.id,
            'title': element.title ? element.title : '',
            'description': element.description ? element.description : '',
            'videoUrl': element.video_url ? videoPath + element.video_url : ''
            
          }
          finalArray.push(tutorial);
        });
        return apiResponse.successResponseWithData(res, "Tutorial List.", finalArray);
      }
      else {
        return apiResponse.successResponseWithData(res, "Data Not Found.", finalArray);
      }
    });
  }
]