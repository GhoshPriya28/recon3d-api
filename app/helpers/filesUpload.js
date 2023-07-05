const multer  = require('multer');
const { constants } = require("../helpers/constants");

const imageFilter = function(req, file, cb) {
    // Accept images only
    
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
exports.imageFilter = imageFilter;

const storage = multer.diskStorage({
      destination: function (req, file, callback) {

        if(file.fieldname=='documents')
        {
          callback(null, constants.path.documentsSavePath);
        }
        if(file.fieldname=='invoices')
        {
          callback(null, constants.path.invoicesSavepath);
        }
        
      },
      filename: function (req, file, callback) { 
        callback(null, Date.now()+'-'+file.originalname)
      },
      fullname: function (req, file, callback) { 
        callback(null, 'fullimage');
      }
});

/*profile */
const profile = multer.diskStorage({
  destination: function (req, file, callback) {
    
    if(file.fieldname=='profile')
    {
      callback(null, constants.path.profileSavepath);
    }
    
  },
  filename: function (req, file, callback) { 
    callback(null, Date.now()+'-'+file.originalname)
  },
  fullname: function (req, file, callback) { 
    callback(null, 'fullimage');
  }
});

/* Invoice upload */
const invoices = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, constants.path.documentsSavePath);
  },
  filename: function (req, file, callback) {
    callback(null, Date.now()+'-'+file.originalname)
  },
  fullname: function (req, file, callback) { 
    callback(null, 'fullimage');
  }
});
exports.storage = storage;
exports.invoices = invoices;
exports.profile = profile;