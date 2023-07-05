const util = require("util");
const multer = require("multer");
const fs = require('fs');
const utility = require("../helpers/utility");
const maxSize = 50 * 1024 * 1024;
var initiateIdNew;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Destination Body',req.body)
    var initiateId = req.body.initiateId?req.body.initiateId:initiateIdNew;
    console.log('First Initiate Id',initiateId);
    const dir = `./uploads/3d-requests/${initiateId}`
    console.log(dir);
    fs.exists(dir, exist => {
      if (!exist) {
        return fs.mkdir(dir, error => cb(error, dir))
      }
      return cb(null, dir)
    })
  },
  filename: (req, file, cb) => {
    console.log('FileName Body',req.body)
    var { chunkIndex,fileType,fileIndex } = req.body
    var initiateId = req.body.initiateId?req.body.initiateId:initiateIdNew;
    if(fileType === 'image')
    {
      const ext = file.mimetype.split("/")[1];
      cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
    }
    else
    {      
      cb(null, `${initiateId}-index-${fileIndex}-chunk-${chunkIndex}`,initiateId)
    }
    
  },
});
let uploadFile = multer({
  storage: storage,
  //limits: { fileSize: maxSize },
  onError : function(err, next) {
      console.log('error', err);
      next(err);
  }
}).array("file");

// let uploadFileMiddleware = util.promisify(uploadFile);

const handleSingleUploadFile = async (req, res) => {
  initiateIdNew = utility.randomNumber(8);
  return new Promise((resolve, reject) => {
    uploadFile(req, res, (error) => {
      if(error)
      {
        console.log('FileName Multer Error',error)
        reject(error);
      }
      else
      {
        // console.log('mybody',req.body)
        // if(!req.body.initiateId)
        // {
        //   console.log('Request Initiate id not found')
        //   initiateIdNew = utility.randomNumber(8);
        // }
        console.log('FileName Multer Success',req.body)
        var initiateId = req.body.initiateId?req.body.initiateId:initiateIdNew;
        resolve({ file: req.files, body: req.body, initiateId: initiateId});
      }
    });
  });
};


module.exports = handleSingleUploadFile;