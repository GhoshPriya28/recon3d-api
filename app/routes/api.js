var express = require("express");
var authRouter = require("./auth");
require("dotenv").config();
const { API_VERSION } = process.env;
var app = express();

app.use("/"+API_VERSION+"/", authRouter);


module.exports = app;