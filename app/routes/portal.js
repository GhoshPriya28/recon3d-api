var express = require("express");
const UsersController = require("../controllers/admin/UsersController.js");
const DeepLinkController = require("../controllers/DeepLinkController.js");

var router = express.Router();
var session = require('express-session');
var app = express();

router.get("/reset-password", UsersController.profile);
router.post("/resetPassword", UsersController.resetPassword);
//router.get("/apple-site-association", DeepLinkController.getLink);

module.exports = router;

