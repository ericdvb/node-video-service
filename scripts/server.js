var express = require('express');
var connectLR = require('connect-livereload');
var bodyParser = require('body-parser');
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
  var delayedResponse = new DelayedResponse(req, res).json();

  var handleError = function(error) {
    console.log(error);
  };
  
  delayedResponse.on('done', function(tweet_id) {
    console.log('delayed response done event fired');
    var responseJSON = {
      success: true,
      tweet_id: result.tweet_id
    }
    res.write( JSON.stringify( responseJSON ) );
    res.end();
  })
  .on('error', delayedResponseHandlers.error)
  .on('cancel', delayedResponseHandlers.cancel);

  delayedResponse.wait();
  


  video.transcodeVideo(req)
    .then(tweets.uploadMedia)
    .then(function(response){
      return tweets.tweetStatusWithVideo(response.media_id_string, req.body);
    })
    .then(function(result) {
      console.log('delayed Response: ' + delayedResponse.end(result.tweet_id));
    });

});


app.use('/', router);
