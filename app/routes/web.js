var express = require("express");
var webRouter = require("./admin");
var app = express();
app.use("/admin/", webRouter);
module.exports = app;