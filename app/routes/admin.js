var express = require("express");
const AuthController = require("../controllers/admin/AuthController.js");
const UsersController = require("../controllers/admin/UsersController.js");
const PagesController = require("../controllers/admin/PagesController.js");
const ScanReportController = require("../controllers/admin/ScanReportController.js");

//const StatusController = require("../controllers/admin/Status.js");
const SendNotificationController = require("../controllers/admin/SendNotification");
const StatusController = require("../controllers/admin/Status.js");
const settingController= require("../controllers/admin/settingsController.js");
const ExportExcel = require("../controllers/admin/ExportExcel.js");
const downloadDb = require("../controllers/admin/dbBackupController.js");

const s3Controller = require("../controllers/admin/s3chunksController.js"); 

var router = express.Router();
var session = require('express-session');
var app = express();
app.use(session({secret:'XASDASDA'}));
var ssn ;

router.get("/get-file/:id", s3Controller.createChunksAndStoreFromS3);

//DB Backup routes
router.get("/db-list", downloadDb.dblist);
router.get("/db-create", downloadDb.create);


//pages
router.get("/header", PagesController.header);
router.get("/sidebar", PagesController.sidebar);
router.get("/dashboard", PagesController.dashboard);
router.get("/footer", PagesController.footer);
//login and logout
router.get("/login", AuthController.login);
router.post("/loginapi", AuthController.loginapi);
router.get("/logout", AuthController.logout);

//users
router.get("/Userlist", UsersController.Userlist);
router.post("/userlistdata", UsersController.userlistdata);
router.get("/profile/:user_id", UsersController.profile);

router.post("/updateprofile", UsersController.profileUpdate);
router.get("/adminprofile", UsersController.adminprofile);
router.get("/UserProfile",UsersController.userProfile);
router.post("/homedata",UsersController.homedata);
router.get("/home/:id",UsersController.home);

router.get("/resetPasswordEmail/:email",UsersController.resetPasswordEmail);
router.get("/collectdetail/:id",UsersController.collectdetail);
router.get("/sendemail/:email",UsersController.SendEmail);

router.post("/deleteObject/:initiateid", UsersController.deleteObjects);
router.get("/reminderemail/:email",UsersController.reminderemail);
router.get("/reset-password", UsersController.profile);
router.post("/resetPassword", UsersController.resetPassword);


router.get("/change_password_by_admin",UsersController.resetPasswordBYAdmin);
router.get("/change_subscription_by_admin",UsersController.resetSuscriptionBYAdmin);

//status
//router.get("/user-status", StatusController.status);
router.get("/UserlistNotification", SendNotificationController.UserlistNotification);
router.post("/userlistdata_notification", SendNotificationController.userlistdataNotification);
router.post("/send-notification", SendNotificationController.send_notification);
router.get("/notificatiomaster", SendNotificationController.notificatiomaster);
router.get("/notificatidetail/:id", SendNotificationController.notificatidetail);


router.get("/processing", ScanReportController.processing);
router.post("/processingData", ScanReportController.processingData);

router.get("/initiate", ScanReportController.initiate);
router.post("/initiateData", ScanReportController.initiateData);


//status
router.get("/user-status", StatusController.status);
//Update Profile...
router.post("/profile-update", UsersController.profileUpdate);
router.post("/settings", settingController.settings);
router.post("/update-email", UsersController.updateEmail);
router.get("/settingList", ScanReportController.settingList);
router.post("/settingListData", ScanReportController.settingListData);

router.get("/download_excel",ExportExcel.download_excel);

router.get("/priorityProcess", ScanReportController.priorityQ);
router.post("/updatejobs", ScanReportController.updatejobs);
router.post("/subscribe-user", UsersController.subscribedUser);


router.get('/*', function(req, res, next) {
    res.locals.data = req.session.email;
    next();
});


module.exports = router;

