var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./app/routes/index");
var apiRouter = require("./app/routes/api");
var apiResponse = require("./app/helpers/apiResponse");
var cors = require("cors");
var expressWinston = require('express-winston');
var winston = require('winston'); // for transports.Console

// DB connection
// var MONGODB_URL = process.env.MONGODB_URL;
// var mongoose = require("mongoose");
// mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
// 	//don't show the log when it is test
// 	if(process.env.NODE_ENV !== "test") {
// 		console.log("Connected to %s", MONGODB_URL);
// 		console.log("App is running ... \n");
// 		console.log("Press CTRL + C to stop the process. \n");
// 	}
// })
// 	.catch(err => {
// 		console.error("App starting error:", err.message);
// 		process.exit(1);
// 	});
// var db = mongoose.connection;

var app = express();

//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}

const filename = path.join(__dirname, 'logs/app.log');
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

//To allow cross-origin requests
app.use(cors());

//const db = require("./app/models");
//db.sequelize.sync();

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);

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
app.listen(PORT, () => {
  console.log(`Server is running on port1 ${PORT}.`);
});

