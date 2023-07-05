const db = require("../models");
const multer  = require('multer');
const express=require('express');
const apiResponse = require("../helpers/apiResponse");
const fileHelper = require("../helpers/filesUpload");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
var configFile = require('../config/configFile');
const path = require('url');
var fs = require("fs");
var imageBasePath=configFile.getBaseUrl();
var upload = multer({storage: fileHelper.profile,fileFilter:fileHelper.imageFilter}).single('profile');

exports.profileUpload = (req, res) => {
	upload(req, res, function (err) {
		if (err instanceof multer.MulterError) {
		    return apiResponse.notFoundResponse(res,"File Error.", err.message);
		} else if (err) {
			return apiResponse.notFoundResponse(res,"File Error.",err.message);
		  }
        var profileViewPath=constants.path.profileViewPath;
        var profile=req.file;
        profile.fullpath=imageBasePath+profileViewPath+req.file.filename;
        return apiResponse.successResponseWithData(res,"File uploaded successfully.", profile);
		
	  });
 }










