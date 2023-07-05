const path = require('path')
const apiResponse = require("../helpers/apiResponse");

exports.getLink = function () {
  return function (req, res) {
    const aasa = path.join('./', 'apple-app-site-association')
    res.set('Content-Type', 'application/pkcs7-mime')
    res.status(200)
    res.sendFile(aasa)
    return res
  }
}