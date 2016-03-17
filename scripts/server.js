// third party libraries
var express = require('express');
var connectLR = require('connect-livereload');
var DelayedResponse = require('http-delayed-response');
var delayedResponseHandlers = require('./delayedResponseHandlers.js');
var requestDispatcher = require('./requestDispatcher.js');
var multer = require('multer');
var mongo = require('mongodb').MongoClient;

// import our modules
var tweets = require('./tweets.js')(router);
var emails = require('./emails.js')(router);
var video = require('./video.js')(router);

var app = express();

app.listen( 4000, function() {
  console.log('started listening on 4000');
});

// ******* MULTER SETUP ********
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
                 cb(null, 'uploads/');
               },
  filename: function(req, file, cb) {
              cb(null, Date.now() + '.mov');
            }
});
var upload = multer({ storage: storage });


// ******* STATIC SERVER *******
app.use( connectLR( { port: 35729 } ) );
app.use( express.static(__dirname + '/../'));

// ******* API ROUTES *******
// 
// Create our router
var router = express.Router();

// hit this to start dispatching requests to Twitter, if they're currently not firing 
router.post('/dispatcher/start', (req, res) => {
  requestDispatcher.start();
  res.end();
});

// hit this to stop dispatching requests to Twitter, if they're currently firing 
router.post('/dispatcher/pause', (req, res) => {
  requestDispatcher.pause();
  res.end();
})

// Create route for POSTing new videos
// The route accepts an upload and a shareTo address, either a
// twitter handle (twitterName) or email address (email)
router.post( '/video', upload.single('video'), (req, res, next) => {

  // create our response promise
  // set the content-type header to application/json using .json()
  var delayedResponse = new DelayedResponse(req, res);

  var handleError = function(error) {
    console.log(error);
  };

  delayedResponse.start(2000, 5000);

  delayedResponse.on('error', delayedResponseHandlers.error)
  .on('cancel', delayedResponseHandlers.cancel);


  video.transcodeVideo(req)
    .then(function(result) {
        if(req.body.twitterName) {
          //return tweets.uploadMedia(result, req);
          console.log('trying to insert into request queue');
          return requestDispatcher.queueRequest({
            mediaUploaded: "false",
            statusUpdated: "false",
            lastAttempt: Date.now(),
            filePath: result,
            twitterName: req.body.twitterName
          });
        } else {
          return new Promise(function(resolve, reject) {resolve(result);});
        }
    })
    .then(function(result) {
      console.log(result);
      if(req.body.email) {
        return emails.sendMail( emails.createMessage( result, req ));
      } else {
        return new Promise(function(resolve, reject) {resolve(result);})
      }
    })
    .then(function(result) {
      console.log(result);
      delayedResponse.end(null, {success: true, requestID: result._id});
    });
});


app.use('/', router);
requestDispatcher.start();
