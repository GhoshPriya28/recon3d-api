var express = require("express");
var path = require("path");

var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const jsonencoder=bodyParser.json();
var logger = require("morgan");
var flash = require('express-flash');
var session = require('express-session');
require("dotenv").config();
var indexRouter = require("./app/routes/index");

//Admin
var adminRouter = require("./app/routes/web");


var apiRouter = require("./app/routes/api");
var apiResponse = require("./app/helpers/apiResponse");
var cors = require("cors");
var expressWinston = require('express-winston');
var winston = require('winston'); // for transports.Console


var app = express();

//Admin Session ...

app.use(flash());

app.use(session({ 
  secret: '123456cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge:  1000 * 60 * 60 * 24 * 7}
}))
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});
app.use(flash({ sessionKeyName: 'flashMessage' }));
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());




//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}
const utc = new Date().toISOString().slice(0, 10);
const filename = path.join(__dirname, 'logs/'+utc+'/app.log');
expressWinston.requestWhitelist.push('body')
expressWinston.responseWhitelist.push('body')
app.use(expressWinston.logger({
    
    format: winston.format.combine(
        winston.format.simple(),
    ),
    transports: [
        new winston.transports.File({ filename: filename }),
    ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "uploads")));
app.use("/downloads", express.static(path.resolve(__dirname + '/downloads')));
app.use("/profile", express.static(path.resolve(__dirname + '/profile')));
console.log(path.resolve(__dirname + '/profile/default.png'));
app.use(express.static(path.join(__dirname, "public")));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//To allow cross-origin requests
app.use(cors());


// automate create db table
// const db = require("./app/models");
// db.sequelize.sync();

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);
app.use("/web/",adminRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if(err.name == "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

const PORT = process.env.PORT || 8082;
//var server = app.listen(PORT);
//server.keepAliveTimeout = (60 * 1000) + 1000;
//server.headersTimeout = (60 * 1000) + 2000;
//server.timeout = 1000 * 60 * 10;
app.listen(PORT, () => {
  console.log(`Server is running on port1 ${PORT}.`);
});

