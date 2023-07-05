const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: 0,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.DbBackupModel = require("../models/dbBackupModel.js")(sequelize, Sequelize);

db.UserModel = require("../models/UserModel.js")(sequelize, Sequelize);
db.OtpVerificationModel = require("../models/OtpVerificationModel.js")(sequelize, Sequelize);


db.CountryModel = require("../models/countryCodeModel.js")(sequelize, Sequelize);

db.TermsModel = require("../models/TermsModel.js")(sequelize, Sequelize);
db.AboutModel = require("../models/AboutModel.js")(sequelize, Sequelize);
db.PrivacyPolicyModel = require("../models/PrivacyPolicyModel.js")(sequelize, Sequelize);

db.NotificationModel = require("../models/NotificationModel.js")(sequelize, Sequelize);
db.PaymentModel = require("../models/PaymentModel.js")(sequelize, Sequelize);
db.CityModel = require("../models/CityModel.js")(sequelize, Sequelize);

db.ContactModel = require("../models/ContactModel.js")(sequelize, Sequelize);



db.LoginModel = require("../models/LoginModel.js")(sequelize, Sequelize);
db.RoleModel = require("../models/RoleModel.js")(sequelize, Sequelize);

db.ContactDetail = require("../models/ContactDetail.js")(sequelize, Sequelize);
db.EmailModel = require("../models/EmailModel.js")(sequelize, Sequelize);


db.FileTaskModel = require("../models/FileTaskModel.js")(sequelize, Sequelize);
db.TaskListModel = require("../models/TaskListModel.js")(sequelize, Sequelize);

/* Admin*/
db.LoginModel = require("../models/LoginModel.js")(sequelize, Sequelize);

/*Collect */
db.CollectListModel = require("../models/CollectListModel.js")(sequelize, Sequelize);
db.CollectDetailModel = require("../models/CollectDetailModel.js")(sequelize, Sequelize);

db.SubFileTaskModel = require("../models/SubFileTaskModel.js")(sequelize, Sequelize);

db.SubscriptionModel = require("../models/SubscriptionModel.js")(sequelize, Sequelize);

db.PaymentModel = require("../models/PaymentModel.js")(sequelize, Sequelize);


/*pages*/
db.PrivacyPolicyModel = require("../models/PrivacyPolicyModel.js")(sequelize, Sequelize);
db.TermsModel = require("../models/TermsModel.js")(sequelize, Sequelize);
db.FaqsModel = require("../models/FaqsModel.js")(sequelize, Sequelize);
db.TutorialsModel=require("../models/TutorialsModel")(sequelize,Sequelize);
db.EmailsupportModel = require("../models/EmailsupportModel.js")(sequelize, Sequelize);
db.EmailTamplateModel = require("../models/EmailTamplateModel.js")(sequelize, Sequelize);
db.ChunkModel = require("../models/ChunkModel.js")(sequelize, Sequelize);
db.AppLogModel = require("../models/AppLogModel.js")(sequelize, Sequelize);
db.DeviceDetailModel = require("../models/DeviceDetailModel.js")(sequelize, Sequelize);
db.NotificationDetailModel = require("./NotificationDetailModel.js")(sequelize, Sequelize);
db.UserNotificationModel = require("./UserNotificationModel.js")(sequelize, Sequelize);
db.PreCompleteTaskModel = require("./PreCompleteTaskModel.js")(sequelize, Sequelize);

module.exports = db;