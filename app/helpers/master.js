const db = require("../models");
const { UserModel: UserModel, OtpVerificationModel: OtpVerificationModel,InvoiceModel:InvoiceModel} = db;
const Op = db.Sequelize.Op;

exports.getuser=function(query) {
    var data=UserModel.findOne({ where:query});
    
    return data;
    /*UserModel.findOne({ where:query}).then(users => {  
        //console.log(users);
        return callback(users);

    });   */ 
} 