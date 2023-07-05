const db = require("../models");
const { CountryModel: CountryModel,TermsModel:TermsModel,AboutModel:AboutModel,PrivacyPolicyModel:PrivacyPolicyModel,InvoiceStatusModel:InvoiceStatusModel,
RefrenceModel:RefrenceModel,CityModel:CityModel,ContactModel:ContactModel,ContactDetail:ContactDetail
} = db;
const Op = db.Sequelize.Op;
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const auth = require("../middlewares/jwt");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { constants } = require("../helpers/constants");
const path = require('url');
exports.countryList = [
    function (req, res) {
        console.log(res);
        try {
            if(req.query.type==1)
            {
                CountryModel.findAll().then(function(countryList) {
                 let countryListAr=countryList.map((r) => {
                    let retValue={
                        countries_name:r.dataValues.countries_name,
                        country_short_name:r.dataValues.countries_iso_code,
                        country_code:r.dataValues.countries_isd_code,
                    }
                    return retValue;
                  });
                
                return apiResponse.successResponseWithDataLocation(res,"country", countryListAr);
                });
            }
            else if(req.query.type==2)
            {
                CityModel.findAll().then(function(cityList) {
                 let cityListAr=cityList.map((r) => {
                    let retValue={
                        
                        countries_name:r.dataValues.city,
                        country_short_name:r.dataValues.iso_code,
                        country_code:r.dataValues.id.toString()
                    }
                    return retValue;
                  });
                
                return apiResponse.successResponseWithDataLocation(res,"city", cityListAr);
            });
            }
            
            
        } catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];


exports.cityList = [
    function (req, res) {
        //console.log(res);
        try {

            CityModel.findAll().then(function(cityList) {
                 let cityListAr=cityList.map((r) => {
                    let retValue={
                        id:r.dataValues.id,
                        city:r.dataValues.city,
                        iso_code:r.dataValues.iso_code,
                        lat:r.dataValues.lat,
                        lng:r.dataValues.lng
                    }
                    return retValue;
                  });
                
                return apiResponse.successResponseWithData(res,"City List.", cityListAr);
            });
            
        } catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

exports.getPagesData = [
    function (req, res) {
        //console.log(res);
        try {
            //const page = req.params.pageType;
            if(req.query.pageType)
            {
                if(req.query.pageType=='terms')
                {
                    TermsModel.findAll().then(function(terms) {
                        let termsAr=terms.map((r) => {
                            return apiResponse.successResponseWithData(res,"Terms & Condition.", r.dataValues);
                        });
                       // return apiResponse.ErrorResponse(res, err);
                    });
                }
                else if(req.query.pageType=='aboutUs')
                {
                    AboutModel.findAll().then(function(terms) {
                        let termsAr=terms.map((r) => {
                            return apiResponse.successResponseWithData(res,"About us.", r.dataValues);
                        });
                        //return apiResponse.ErrorResponse(res, err);
                    });
                }
                else if(req.query.pageType=='privacyPolicy')
                {
                    PrivacyPolicyModel.findAll().then(function(data) {
                        let resAr=data.map((r) => {
                            return apiResponse.successResponseWithData(res,"Privacy Policy.", r.dataValues);
                        });
                       // return apiResponse.ErrorResponse(res, err);
                    });
                }
            }
            else
            {
                return apiResponse.ErrorResponse(res, err);
            }
        }
        catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

//Status List..
exports.getStatusList=[
    function (req, res) {
        try {
            InvoiceStatusModel.findAll().then(function(status) {
                
                let statusAr=status.map((r) => {
                    return  r.dataValues;
                });
                return apiResponse.successResponseWithData(res,"Status List.", statusAr);
                //return apiResponse.ErrorResponse(res, err);
            });
        }
        catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

exports.addRefrence=[    
    auth,
    body("ref_name").isLength({ min: 1 }).trim().withMessage("Refrence name be specified."),
    body("ref_mobile").isLength({ min: 1 }).trim().withMessage("Refrence mobile must be specified."),
    body("ref_business").isLength({ min: 1 }).trim().withMessage("Refrence must be specified."),
    body("ref_address").isLength({ min: 1 }).trim().withMessage("Refrence address must be specified."),
    function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Display sanitized values/errors messages.
                return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
            }else {
                    
                        const refData = new RefrenceModel(
                        {
                            add_by:req.user.user_id,
                            ref_name:req.body.ref_name,
                            ref_mobile:req.body.ref_mobile,
                            ref_business:req.body.ref_business,
                            ref_address:req.body.ref_address
                        });
                       // console.log(refData);
                        refData.save(function (err) {
                             if (err) { return apiResponse.ErrorResponse(res, err); }
                         }).then(function(){
                             return apiResponse.successResponseWithData(res,"Refrence submitted successfully!");
                         });
                        
            }
        }
        catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
}];

exports.contactUs=[
    body("name").isLength({ min: 1 }).trim().withMessage("Name be specified."),
    body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified."),
    body("contact").isLength({ min: 1 }).trim().withMessage("Contact must be specified."),
    body("message").isLength({ min: 1 }).trim().withMessage("Message address must be specified."),
    function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Display sanitized values/errors messages.
                return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
            }else {
                const conData = new ContactModel(
                    {
                        name:req.body.name,
                        email:req.body.email,
                        contact:req.body.contact,
                        message:req.body.message
                    });
                    conData.save(function (err) {
                        if (err) { return apiResponse.ErrorResponse(res, err); }
                    }).then(function(){
                        return apiResponse.successResponseWithData(res,"Contact details submitted successfully!");
                    });
            }
        }
        catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];

exports.contact=[
    function (req, res) {
        try {
            
            ContactDetail.findOne().then(contact => {    
                
                return apiResponse.successResponseWithData(res,"Conact.", contact);
                
            });
        }
        catch (err) {
            return apiResponse.ErrorResponse(res, err);
        }
    }
];