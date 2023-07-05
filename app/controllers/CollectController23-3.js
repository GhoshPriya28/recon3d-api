require('dotenv').config();

const db = require("../models");
const { CollectListModel:CollectListModel,CollectDetailModel:CollectDetailModel,FileTaskModel:FileTaskModel } = db;
const Op = db.Sequelize.Op;
const fs = require('fs');
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//const multer  = require('multer');
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const path = require('url');
const paths = require('path');
const { json } = require('body-parser');


exports.dataCollect= [
	(req, res) => {
		// Validate fields.
		body("collect_id").isLength({ min: 1 }).trim().withMessage("Collect id must be specified."),
	body("collect_status").isLength({ min: 1 }).trim().withMessage("Collect Status id must be specified."),
    body("assets").isLength({ min: 1 }).trim().withMessage("Assets id must be specified.")
	try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.notFoundResponse(res, errors.array()[0].msg, errors.array());
				//return apiResponse.notFoundResponse(res, "Validation Error.", errors.array());
			}else {
				
				if(req.body.collect_id=='')
				{
					return apiResponse.notFoundResponse(res, 'Collect id must be specified.');
				}
				else if(req.body.collect_status=='')
				{
					return apiResponse.notFoundResponse(res, 'Collect Status id must be specified.');
				}
				else if(req.body.assets=='')
				{
                    return apiResponse.notFoundResponse(res, 'Assets id must be specified.');
				}
				else
				{

					const collect = 
                    {
                        collect_id: req.body.collect_id,
                        status: req.body.collect_status
                    }
					
					
                     CollectListModel.findOrCreate({where:{collect_id: req.body.collect_id},defaults: collect}).then(collectD => {
						FileTaskModel.findOne({where: {ep_collect_id: req.body.collect_id}}).then(collect_id => {
							if(collect_id)
							{
								var status='0';
								if(req.body.collect_status=='COMPLETE')
								{
									status='2';
								}
								FileTaskModel.update({internal_status:status},{where: {ep_collect_id: req.body.collect_id}}).then(updatedData => {
									req.body.assets.forEach(function(item) {
										var collectD = {
											collect_id: req.body.collect_id,
											asset_name: item.asset_name,
											asset_type: item.asset_type,
											asset_extension: item.asset_extension,
											asset_size: item.asset_size,
											asset_url: item.asset_url,
										}
										console.log(collectD);
										CollectDetailModel.create(collectD).then(list=>{
			
										}).catch(err => {
											console.log(err)
											return apiResponse.ErrorResponse(res, err);
										});
				
									})
									return apiResponse.successResponseWithData(res,"Collection submitted.");
								}).catch(err => {
									console.log(err)
									return apiResponse.ErrorResponse(res, err);
								});
							}
						}); 
						
					}).catch(err => {
						console.log(err)
						return apiResponse.ErrorResponse(res, err);
					});
				}
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
		
	}
];