var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'i3exchange_app'
});
 


//app.use("/auth/", authRouter);
//app.use("/inv/", invRouter);

connection.connect();
router.get('/login', function(req, res, next) {
    res.render('login');
  });
  router.post('/login', function(req, res){
    var emailAddress = req.body.email_address;
    var password = req.body.password;
    var sql='SELECT * FROM app_users WHERE email_address =? AND password =?';
    db.query(sql, [emailAddress, password], function (err, data, fields) {
        if(err) throw err
        if(data.length>0){
            req.session.loggedinUser= true;
            req.session.emailAddress= emailAddress;
            res.redirect('/dashboard');
        }else{
            res.render('login-form',{alertMsg:"Your Email Address or password is wrong"});
        }
    })
})
module.exports = app;

