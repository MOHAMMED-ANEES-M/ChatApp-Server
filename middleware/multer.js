const multer = require('multer');
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(file,'file multer');
    cb(null, 'images/');
  },
  filename: function (req, file, cb) {
    const extension = MIME_TYPES[file.mimetype];
    cb(null, file.originalname.split(' ').join('_') + '_' + Date.now() + '.' + extension);
  }
});

module.exports = multer({ storage: storage }).single('image');