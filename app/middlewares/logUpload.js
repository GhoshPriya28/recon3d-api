const util = require("util");
const multer = require("multer");
const fs = require('fs');
const maxSize = 100 * 1024 * 1024;
const path = require('path');
var userIdNew;


let storage = multer.diskStorage({
  destination: (req, file, cb) => {
   // console.log('Destination Body',req)
    var userId = req.body.userId?req.body.userId:userIdNew;
    console.log('First User Id',userId);
    const dir = `./uploads/LogFiles/`
    fs.exists(dir, exist => {
      if (!exist) {
        return fs.mkdir(dir, error => cb(error, dir))
      }
      return cb(null, dir)
    })
  },
  filename: (req, file, cb) => {
    //console.log('FileName Body',req.body)
    var { chunkIndex,fileType,fileIndex } = req.body
    var userId = req.body.userId?req.body.userId:initiateIdNew;
    
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
  
    
  },
});
let uploadFile = multer({
  storage: storage,
  // fileFilter: fileFilter,
  limits: { fileSize: maxSize },
}).single("logFile", 100);

// let uploadFileMiddleware = util.promisify(uploadFile);

const handleSingleUploadFile = async (req, res) => {
 
  return new Promise((resolve, reject) => {
    uploadFile(req, res, (error) => {
      console.log('Chekkkkk',req.body);
      if(error)
      {
        reject(error);
      }
      else
      {
        
        var userId = req.body.userId;
        resolve({ file: req.file, body: req.body, userId: userId});
      }
    });
  });
};


module.exports = handleSingleUploadFile;