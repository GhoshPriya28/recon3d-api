exports.successResponse = function (res, msg) {
	var data = {
		status: true,
		code: 200,
		message: msg
	};
	return res.status(200).json(data);
};

exports.successResponseWithData = function (res, msg, data) {
	var resData = {
		status: true,
		code: 200,
		message: msg,
		data: data,
		//pagination:pagination,
		//userDetails:userDetails
	};
	return res.status(200).json(resData);
};

exports.successResponseWithDownload = function (res, msg, download,data) {
	var resData = {
		status: true,
		code: 200,
		message: msg,
		downloadStatus:download,
		data: data,

		//pagination:pagination,
		//userDetails:userDetails
	};
	return res.status(200).json(resData);
};

exports.successResponseWithDataInstant = function (res, msg, data) {
	var resData = {
		status: true,
		code: 200,
		message: msg,
		data: data,
		//pagination:pagination,
		//userDetails:userDetails
	};
	return res.status(200).json(resData);
};

exports.successResponseWithDataLocation = function (res, msg, data,pagination,userDetails) {

   
    if(msg=='country')
    {
    	var resData = {
		status: true,
		code: 200,
		message: msg,
		'country': data
	   };
	   return res.status(200).json(resData);
    }
    if(msg=='city')
    {
    	 var resData = {
		status: true,
		code: 200,
		message: msg,
		'city': data
	   };
	   return res.status(200).json(resData);
    }
   
};

exports.ErrorResponse = function (res, msg) {
	var data = {
		status: false,
		code: 500,
		message: msg,
	};
	return res.status(500).json(data);
};

exports.notFoundResponse = function (res, msg,data) {
	var data = {
		status: false,
		code: 1,
		message: msg,
		data:data
	};
	return res.status(200).json(data);
};

exports.validationErrorWithData = function (res, msg, data) {
	var resData = {
		status: false,
		code: 400,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

exports.unauthorizedResponse = function (res, msg) {
	var data = {
		status: false,
		code: 401,
		message: msg,
	};
	return res.status(401).json(data);
};