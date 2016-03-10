module.exports = function(router) {

var multer = require('multer');

// Multer setup
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '.mov');
  }
});
var upload = multer({ storage: storage });

// Create route for POSTing video for processing
router.post( '/video', upload.single('video'), function(req, res, next) {
  console.log(req.file);
  req.file == undefined ? res.append('Status', 200) : res.set('Status-Code', 500);
  res.end();
});
};
