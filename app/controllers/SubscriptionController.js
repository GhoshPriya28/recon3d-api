require('dotenv').config();
const { BASE_URL} = process.env;
const db = require("../models");
const { UserModel:UserModel,SubscriptionModel: SubscriptionModel,PaymentModel:PaymentModel} = db;
const Op = db.Sequelize.Op;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('AuthKey');
const path = require('url');
const userResponseUtility = require("../helpers/userResponseUtility");
const auth = require("../middlewares/jwt");
const { sequelize } = require("../models");
/* Forgot Password*/
exports.subscriptionList = [
    
    async(req, res) => {
        try
        {
            var userId = req.query.userId;
            await SubscriptionModel.findAll().then(async data => {
                
                    
                const Query = "SELECT * FROM payment_details where user_id="+userId+"";
               // let RecievedResponse =  getDashboardData(Query);
                let fundingRecieved = await getDashboardData(userId,Query);
                let subscribePlan={};
                fundingRecieved.forEach(function(value, index) {
                  //  if()
                  subscribePlan[value.product_id]=value;
                 // console.log(value.product_id);
                  //console.log(index);
                });
                //console.log(subscribePlan);
                var finalData=data.map((r) => {
                    var duration='';
                    if(r.plan_type=='yearly')
                    {
                        duration=r.plan_duration+' Year';
                    }
                    if(r.plan_type=='monthly')
                    {
                        duration=r.plan_duration+' Month';
                    }

                    let is_subscribe=false;
                   // console.log(r.product_id);
                    
                    if(subscribePlan[r.product_id])
                    {
                      is_subscribe=true;
                    }
                    
                    var dataRes={
                        plan_id: r.plan_id,
                        product_id: r.product_id,
                        product_name: r.product_name,
                        product_description: r.product_description?r.product_description:'',
                        plan_source: r.plan_source?r.plan_source:'',
                        plan_type: r.plan_type?r.plan_type:'',
                        plan_amount: r.plan_amount?r.plan_amount:'',
                        plan_duration:duration,
                       //discount_amount: r.discount_amount?r.discount_amount:'',
                        payable_amount: r.plan_amount?r.plan_amount+' $':'',
                        is_subscribe:is_subscribe
                    }
                     return dataRes;
                });
                
                return apiResponse.successResponseWithData(res,"Plan List.",finalData);
              });
              
        }   
        catch (err)
        {
            logger.error({ level: 'error', message: 'Error.', meta: JSON.stringify(ErrorData(req))})
            return apiResponse.ErrorResponse(res, err);
        }
    }
];


/* Forgot Password*/
exports.userPayment = [
    auth,
    body("userId").isLength({ min: 1 }).trim().withMessage("User Id must be specified."),
    body("product_id").isLength({ min: 1 }).trim().withMessage("Product must be specified."),
    //body("transaction_id").isLength({ min: 1 }).trim().withMessage("Transaction id must be specified."),
    body("source").isLength({ min: 1 }).trim().withMessage("Source must be specified."),
    body("total_amount").isLength({ min: 1 }).trim().withMessage("Amount must be specified."),
    body("payment_status").isLength({ min: 1 }).trim().withMessage("Payment status must be specified."),
   // body("from_date").isLength({ min: 1 }).trim().withMessage("From date must be specified."),
    //body("to_date").isLength({ min: 1 }).trim().withMessage("To date must be specified."),
    
    (req, res) => {
        try
        {
            const errors = validationResult(req);
            if (!errors.isEmpty())
            {
                return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
            }
            else
            {
                if(req.body.payment_status=='SUCCESS')
                {
                    let subData={
                        user_id:req.body.user_id,
                        product_id:req.body.product_id,
                        transaction_id:req.body.transaction_id?req.body.transaction_id:'',
                        source:req.body.source,
                        total_amount:req.body.total_amount,
                        payment_status:req.body.payment_status,
                        subscription:1,
                       // from_date:req.body.from_date?req.body.from_date:'',
                       // to_date:req.body.to_date?req.body.to_date:'',
                    } 
                    SubscriptionModel.findOne({where: {product_id: req.body.product_id}}).then(product => {
                        if(product)
                        {
                            PaymentModel.findOrCreate({where:{user_id: req.body.userId,product_id: req.body.product_id},defaults: subData}).then(transaction => {
                                UserModel.update({is_subscribe:'1'},{where: {id: req.body.userId}}).then(updatedData => {
                                    console.log();
                                    return apiResponse.successResponseWithData(res,"Payment success.");
                                }).catch(err => {
                                    console.log(err)
                                    return apiResponse.ErrorResponse(res, err);
                                });
                             
                               }).catch(err => {
                                console.log(err)
                                return apiResponse.ErrorResponse(res, err);
                            });
                        }
                        else
                        {
                            return apiResponse.notFoundResponse(res, "Subscription mismatch.");
                        }
                        
                    }).catch(err => {
                            console.log(err)
                            return apiResponse.ErrorResponse(res, err);
                        }); 
                   
                   
                   
                }
                
            }
        }
        catch (err)
        {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];


exports.user_subscription = [
    function (req, res) {
        try
        {
            var userId = parseInt(req.query.userId,10);
            if(userId)
            {
                PaymentModel.findOne({where: {user_id: req.query.userId}}).then(r => {
                    var duration='';
                    if(r.plan_type=='yearly')
                    {
                        duration=r.plan_duration+' Year';
                    }
                    if(r.plan_type=='monthly')
                    {
                        duration=r.plan_duration+' Month';
                    }
                    var dataRes={
                        plan_id: r.plan_id,
                        product_id: r.product_id,
                        product_name: r.product_name,
                        product_description: r.product_description?r.product_description:'',
                        plan_source: r.plan_source?r.plan_source:'',
                        plan_type: r.plan_type?r.plan_type:'',
                        plan_amount: r.plan_amount?r.plan_amount:'',
                        plan_duration:duration,
                       //discount_amount: r.discount_amount?r.discount_amount:'',
                        payable_amount: r.plan_amount?r.plan_amount+' $':'',
                        is_subscribe:false
                    }
                    return apiResponse.successResponseWithData(res,"Subscription Detail.",dataRes);
                });
            }
            else
            {
                return apiResponse.notFoundResponse(res, "Provide a user id.");
            }
        }
        catch (err)
        {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];


const getDashboardData = async(userId,queryString) => 
{
    return new Promise((resolve, reject) => {
        sequelize.query(queryString,{type: sequelize.QueryTypes.SELECT}).then(dashboardData => {        
            //console.log('Dashboard Data',dashboardData)
            resolve(dashboardData)
        }).catch(error => {
            console.log('Dashboard Data Error',error)
            reject(error)
        })
    })
}

