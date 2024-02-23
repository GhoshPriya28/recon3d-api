require('dotenv').config();
const { BASE_URL,EVP_API_VERSION,EVP_BASE_URL,EVP_USER_ID,EVP_CUSTOMER_ID,EVP_API_USERNAME,EVP_API_PASSWORD,EVP_API_SRC_TYPE,FCM_KEY} = process.env;
const db = require("../models");
const {NotificationDetailModel:NotificationDetailModel} = db;
const Op = db.Sequelize.Op;
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const jwt = require("jsonwebtoken");
var FCM = require('fcm-node');

exports.sentNotificationSingle = function(recaver_id=null,title=null,dataO=null)
{
    var serverKey =FCM_KEY; //put your server key here
    var fcm = new FCM(serverKey);
    
     var send_id=recaver_id;     
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: send_id.trim(), 
        collapse_key: '',
        
        notification: {
            title: title, 
            body: 'Your collection name:'+dataO.collect_name 
        },
        
        data: {  //you can send only notification or only data(or include both)
            collect_id: dataO.collect_id,
            collect_name: dataO.collect_name,
            initiate_id: dataO.initiate_id
        }
    };

    console.log(message);
    
    fcm.send(message, function(err, response){
        console.log(err);
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
	//var fcm = new FCM(serverKey);
}


exports.sentNotificationMultiple = async (receiver_id = null, title = null, data0 = null,notificationID=null) => {
    var serverKey = FCM_KEY;
    var fcm = new FCM(serverKey);
    var message = {
        registration_ids: receiver_id,
        notification: {
            title: title,
            body: data0.comment
        },
        data: {
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    };
    fcm.send(message, function async(err, response) {
       // console.log(response)
        
        if (err) {
            var resErr=JSON.parse(err);
            let save=JSON.stringify(resErr);
            let updateData={
                log:save
            }
            NotificationDetailModel.update(updateData, {where:{id : notificationID}}).then(data => {
              
            }).catch(err => {
                console.log(err);
                //return apiResponse.ErrorResponse(res, err);
            });
            ///return false
            
        } else {
            let resSuccess=JSON.parse(response);
            let save=JSON.stringify(resSuccess);        
            let updateData={
                log:save
            }
            NotificationDetailModel.update(updateData, {where:{id : notificationID}}).then(data => {
              
            }).catch(err => {
                console.log(err);
                //return apiResponse.ErrorResponse(res, err);
            });
        }
    })
}
