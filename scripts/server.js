var express = require('express');
var connectLR = require('connect-livereload');
var DelayedResponse = require('http-delayed-response');
var delayedResponseHandlers = require('./delayedResponseHandlers.js');
var multer = require('multer');


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

var tweets = require('./tweets.js')(router);
var emails = require('./emails.js')(router);
var video = require('./video.js')(router);

// Create our routes

// Create route for POSTing new media to media/update twitter endpoint
// and then posting status update

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
      console.log(result);
      console.log(req.body);
      if(req.body.twitterName) {
        return tweets.uploadMedia(result, req);
      } else {
        return new Promise(function(resolve, reject) {resolve(result);});
      }
    })
    .then(function(result) {
      console.log(result);
      if(req.body.twitterName) {
        return tweets.tweetStatusWithVideo(result.media_id_string, req);
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
      delayedResponse.end(null, {success: true, tweet_id: result.tweet_id});
    });
});


app.use('/', router);
