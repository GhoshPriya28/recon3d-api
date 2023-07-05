const jwt = require("jsonwebtoken");
const apiResponse = require("../helpers/apiResponse");
const config = process.env;

const verifyToken = (req, res, next) => {
  const token =
  req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
	return apiResponse.unauthorizedResponse(res, "A token is required for authentication.");
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
   	req.user = decoded; 
	
  } catch (err) {
	return apiResponse.unauthorizedResponse(res, "unauthorized access.");
	
  }
  return next();
};

module.exports = verifyToken;