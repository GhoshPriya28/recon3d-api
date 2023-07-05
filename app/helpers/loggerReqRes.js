exports.ValidationErrorData = function (req) {
	const resData = {
		status: false,
		code: 400,
		uri: req.url,
		method: req.method
	};
	return resData
};
exports.SuccessData = function (req) {
	const resData = {
		status: true,
		code: 200,
		uri: req.url,
		method: req.method
	};
	return resData
};
exports.ErrorData = function (req) {
	const resData = {
		status: false,
		code: 500,
		uri: req.url,
		method: req.method
	};
	return resData
};