var express = require("express");
const AuthController = require("../controllers/AuthController");
const RegisterController = require("../controllers/RegisterController");
const LoginController = require("../controllers/LoginController");
const ProfileController = require("../controllers/ProfileController");

//const MasterController = require("../controllers/MasterController");
const ImageController = require("../controllers/ImageController");

const NotificationController = require("../controllers/NotificationController");
const FileController = require("../controllers/FileController");
const CollectController = require("../controllers/CollectController");

const ForgotPasswordController = require("../controllers/ForgotPasswordController");
const SubscriptionController = require("../controllers/SubscriptionController");

const MastersController = require("../controllers/MastersController.js");

const UserProfileController = require("../controllers/Image.js");
const EverypointController = require("../controllers/EverypointController");

const EverypointController2O = require("../controllers/EverypointController2O");

const EverypointController2OOO = require("../controllers/EverypointController2OOO");
const PreCompleteTaskController = require("../controllers/PreCompleteTaskController");
const EverypointControllerChrone = require("../controllers/EverypointControllerChrone");

var router = express.Router();

// Registration
router.post("/check-value-exist", RegisterController.checkValueExist);
router.post("/register", RegisterController.register);
router.post("/manual_register", RegisterController.manual_register);

// Login
router.post("/login", LoginController.login);
router.post("/social-login", LoginController.socialLogin);
router.post("/update-social", LoginController.updateSocial);

//Profile
router.get("/profile-details", ProfileController.profileDetails);
router.put("/update-profile", ProfileController.updateProfile);
router.delete("/deleteAccount", ProfileController.deleteAccount);
router.put("/update-firebase_id", ProfileController.updateFirebaseId)
// router.post("/file-upload", ProfileController.profileUpload);

router.post("/file-upload-multiple", ImageController.filesUpload);

// router.post("/forgot-password", AuthController.forgatePassword);
// router.post("/reset-password", AuthController.resetPassword);

/*Uploader */
// router.post("/fileTask", FileController.initiateTask);
router.post("/uploadAssets", FileController.filesUpload);
router.get("/downloads3file", FileController.s3download);
// router.post("/createTask", FileController.createTask);
// router.get("/getTaskDetails", FileController.getTaskDetails);
// router.delete("/deleteFile", FileController.deleteFile);
//router.post("/completeTask", FileController.completeTask);
router.get("/scanList", FileController.getScanList);

/*Collect data */
router.post("/collect_data", CollectController.dataCollect);

router.get("/downloadAssets", FileController.downloadAssets);
router.get("/downloadObjects", CollectController.downloadObjects);
router.delete("/deleteObjects/:initiate_id", CollectController.deleteObjects);

router.post("/forgot-password", ForgotPasswordController.forgatePassword);
router.post("/reset-password", ForgotPasswordController.resetPassword);

router.get("/plan_list", SubscriptionController.subscriptionList);

router.post("/payment", SubscriptionController.userPayment);
router.get("/user_subscription", SubscriptionController.user_subscription);


router.get("/getPagesData", MastersController.getPagesData);
router.post("/emailSupport",MastersController.emailsupport);
router.post("/appLog",MastersController.appLog);
router.get("/tutorial",MastersController.tutorial);
router.post("/file-upload", UserProfileController.profileUpload);

router.get("/download3DObjects", FileController.downloadObjects);
router.get("/notification",CollectController.notification);

router.get("/newF",FileController.evNewTest);
//url
router.post("/completeTaskStaging", EverypointController.completeEveryPointTask1);
//chunk
//router.post("/completeEveryPointTask", EverypointController.completeEveryPointTask);
//router.post("/completeTask", EverypointController2O.completeEveryPointTask);
router.post("/completeEveryPointTaskRun", EverypointController2O.completeEveryPointTask);
router.post("/completeEveryPointTask", EverypointController2OOO.completeEveryPointTask);

router.post("/callback", CollectController.callback);
// router.post("/getprio", EverypointController2O.getPriority);


//router.post("/completeEveryPointTask",PreCompleteTaskController.preCompleteTask);

router.post("/chroneForTask",PreCompleteTaskController.chroneForTask);
router.post("/completeEveryPointTaskChrone",EverypointControllerChrone.completeEveryPointTask);



//update priority route
router.post("/update-priority", EverypointController.priorityUpdate);

module.exports = router;

/* Old */




/*var express = require("express");
const AuthController = require("../controllers/AuthController");
const RegisterController = require("../controllers/RegisterController");
const LoginController = require("../controllers/LoginController");
const ProfileController = require("../controllers/ProfileController");

const MasterController = require("../controllers/MasterController");
const ImageController = require("../controllers/ImageController");

const NotificationController = require("../controllers/NotificationController");
const FileController = require("../controllers/FileController");

var router = express.Router();

// Registration
router.post("/check-value-exist", RegisterController.checkValueExist);
router.post("/register", RegisterController.register);

// Login
router.post("/login", LoginController.login);

//Profile
router.get("/profile-details", ProfileController.profileDetails);
// router.put("/update-profile", ProfileController.updateProfile);
// router.post("/file-upload", ProfileController.profileUpload);

router.post("/file-upload-multiple", ImageController.filesUpload);

router.post("/forgot-password", AuthController.forgatePassword);
router.post("/reset-password", AuthController.resetPassword);

/*Uploader 
router.post("/fileTask", FileController.initiateTask);
router.post("/uploadFile", FileController.filesUpload);
router.post("/createTask", FileController.createTask);
router.get("/getTaskDetails", FileController.getTaskDetails);
router.delete("/deleteFile", FileController.deleteFile);
router.put("/uploadTaskComplete", FileController.uploadTaskComplete);
router.post("/uploadAssets", FileController.filesUpload);

module.exports = router;*/

