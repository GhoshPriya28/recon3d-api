const db = require("../../models");
const { LoginModel: LoginModel, UserModel: UserModel, RoleModel: RoleModel, InvoiceModel: InvoiceModel, InvoiceStatusModel: InvoiceStatusModel, CityModel: CityModel, NotificationModel: NotificationModel } = db;
const { WeeklyUserSchema } = db;
const Op = db.Sequelize.Op;
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../../helpers/apiResponse");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const bcrypt = require("bcrypt");
const path = require('url');
const flash = require('connect-flash');
const utility = require("../../helpers/utility");
var moment = require('moment');
var configFile = require('../../config/configFile');
var imageBasePath = configFile.getBaseUrl();
const { constants } = require("../../helpers/constants");
const { sequelize } = require("../../models");

const getDashboardData = async (queryString) => {
    return new Promise((resolve, reject) => {
        sequelize.query(queryString, { type: sequelize.QueryTypes.SELECT }).then(dashboardData => {
            resolve(dashboardData[0])
        }).catch(error => {
            reject(error)
        })
    })
}
exports.status = [
    async (req, res) => {
        if (req.session.name) {
            let dateFromToday = moment().format('YYYY-MM-DD');
            let dateFromWeek = moment().subtract(7, 'd').format('YYYY-MM-DD');
            var dateFromMonth = moment().subtract(1, "month").format("YYYY-MM-DD");
            var dateFromYear = moment().subtract(1, "year").format('YYYY-MM-DD');
            // For app_users
            
            const QueryTotal = "select count(*) as total from app_users";
            let usersTotal = await getDashboardData(QueryTotal);
            const QueryT = "select count(*) as total from app_users where  createdAt like '%"+dateFromToday+"%'";
            let usersToday = await getDashboardData(QueryT);

            const QueryW = "select count(*) as total from app_users where createdAt>='" + dateFromWeek + "'";
            let usersWeek = await getDashboardData(QueryW);
            const QueryM = "select count(*) as total from app_users where createdAt>='" + dateFromMonth + "'";
            var usersMonth = await getDashboardData(QueryM);
            const QueryY = "select count(*) as total from app_users where createdAt>='" + dateFromYear + "'";
            var usersYear = await getDashboardData(QueryY);
            // For file_tasks
            const QueryFileTaskTotal = "select count(*) as total from file_tasks where  ep_collect_id IS NOT NULL";
            let fileTaskTotal = await getDashboardData(QueryFileTaskTotal);

            const QueryToday = "select count(*) as total from file_tasks where createdAt like '%"+dateFromToday+"%' and ep_collect_id IS NOT NULL";
            let fileTaskToday = await getDashboardData(QueryToday);

            const QueryWeek = "select count(*) as total from file_tasks where createdAt>='" + dateFromWeek + "' and ep_collect_id IS NOT NULL";
            let fileTaskWeekly = await getDashboardData(QueryWeek);
            const QueryMonth = "select count(*) as total from file_tasks where createdAt>='" + dateFromMonth + "' and ep_collect_id IS NOT NULL";
            var fileTaskMonthly = await getDashboardData(QueryMonth);
            const QueryYear = "select count(*) as total from file_tasks where createdAt>='" + dateFromYear + "' and ep_collect_id IS NOT NULL";
            const fileTaskYearly = await getDashboardData(QueryYear);
            //For Subscriber
            const totalSubscriber = "select count(*) as total from payment_details where payment_status='SUCCESS'";
            let subscribers = await getDashboardData(totalSubscriber)

            const subscribeT = "select count(*) as total from payment_details where payment_status='SUCCESS' AND createdAt like '%" + dateFromToday + "%'";
            let subscriberToday = await getDashboardData(subscribeT);

            const subscribeW = "select count(*) as total from payment_details where payment_status='SUCCESS' AND createdAt>='" + dateFromWeek + "'";
            let subscriberWeekly = await getDashboardData(subscribeW);
            const subscribeM = "select count(*) as total from payment_details where payment_status='SUCCESS' AND createdAt>='" + dateFromMonth + "'";
            let subscriberMonthly = await getDashboardData(subscribeM);
            const subscribeY = "select count(*) as total from payment_details where payment_status='SUCCESS' AND createdAt>='" + dateFromYear + "'";
            let subscriberYearly = await getDashboardData(subscribeY);

            let where=''; let today=''; let week=''; let month=''; let year='';
            if(req.query.status=='today')
            {
                today='active';
                where="AND  createdAt like '%"+dateFromToday+"%'";
            }
            else if(req.query.status=='week')
            {
                week='active';
                where="AND createdAt>='"+ dateFromWeek +"'";
            }
            else if(req.query.status=='month')
            {
                month='active';
                where="AND createdAt>='"+ dateFromMonth +"'";
            }
            else if(req.query.status=='year')
            {
                year='active';
                where="AND createdAt>='"+ dateFromYear +"'";
            }
            const sumQinitiate = "SELECT count(internal_status) AS total FROM `file_tasks` WHERE  internal_status=0 "+ where +"";
            let initiatedTotal = await getDashboardData(sumQinitiate);

            const sumQPending = "SELECT count(internal_status) AS total FROM `file_tasks` WHERE ep_collect_id IS NOT NULL and internal_status=4 "+ where +"";
            let pendingTotal = await getDashboardData(sumQPending);


            const sumQProcessing = "SELECT count(internal_status) AS total FROM `file_tasks` WHERE ep_collect_id IS NOT NULL and internal_status=1 "+ where +"";
            let processingTotal = await getDashboardData(sumQProcessing);

            const sumQComplete = "SELECT count(internal_status) AS total FROM `file_tasks` WHERE ep_collect_id IS NOT NULL and internal_status=2 "+ where +"";
            let completeTotal = await getDashboardData(sumQComplete);

            const sumQfailed = "SELECT count(internal_status) AS total FROM `file_tasks` WHERE ep_collect_id IS NOT NULL and internal_status=3 "+ where +"";
            let failedTotal = await getDashboardData(sumQfailed);

            //Eparls/Eparse

            const sumQEparls = "SELECT count(*) AS total FROM `file_tasks` WHERE (file_ext='eparls' || file_ext='epars') AND ep_collect_id IS NOT NULL  "+ where +"";
            let EParlsTotal = await getDashboardData(sumQEparls);
            const sumQPhotoGrametry = "SELECT count(*) AS total FROM `file_tasks` WHERE (file_ext!='eparls' && file_ext!='epars') AND ep_collect_id IS NOT NULL  "+ where +"";
            let PhotoGrametryTotal = await getDashboardData(sumQPhotoGrametry);
              //const sumQinitiate = "SELECT count(internal_status) AS total FROM `file_tasks` WHERE ep_collect_id IS NOT NULL and internal_status=0";
           
            

            res.render('user_status',
                {
                    posts: req.session.name,
                    daily:usersToday.total,
                    week: usersWeek.total,
                    month: usersMonth.total,
                    year: usersYear.total,
                    fdaily: fileTaskToday.total,
                    fWeek: fileTaskWeekly.total,
                    fMonth: fileTaskMonthly.total,
                    fYear: fileTaskYearly.total,
                    subscribeD: subscriberToday.total,
                    subscribeW: subscriberWeekly.total,
                    subscribeM: subscriberMonthly.total,
                    subscribeY: subscriberYearly.total,
                    totalUsers: usersTotal.total,
                    totalUploads: fileTaskTotal.total,
                    totalSubscribe: subscribers.total,
                    initiatedTotal:initiatedTotal.total,
                    pendingTotal:pendingTotal.total,
                    processingTotal:processingTotal.total,
                    completeTotal:completeTotal.total,
                    failedTotal:failedTotal.total,
                    eparlsTotal:EParlsTotal.total,
                    photoGrametryTotal:PhotoGrametryTotal.total,
                    duration:req.query.status?req.query.status:'Year',
                    todayT:today,
                    weekT:week,
                    monthT:month,
                    yearT:year,

                }
            );
        } else {
            res.redirect('login');
        }
    }
]