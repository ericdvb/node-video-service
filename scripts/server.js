var express = require('express');
var connectLR = require('connect-livereload');
var bodyParser = require('body-parser');
var DelayedResponse = require('http-delayed-response');
var delayedResponseHandlers = require('./delayedResponseHandlers.js');
var Twit = require('twit');
var multer = require('multer');
var twitterSettings = require('../settings.json').twitter;
var twitterClient = new Twit(twitterSettings);
var nodemailer = require('nodemailer');
var sendgrid = require('nodemailer-sendgrid-transport');
var sendgridOptions = require('../settings.json').sendgrid;


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

// nodemailer setup
var transport = nodemailer.createTransport(sendgrid({
  auth: { api_key: sendgridOptions.api_key }
}));

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

  //delayedResponse.on('done', delayedResponseHandlers.done)
  delayedResponse.on('error', delayedResponseHandlers.error)
  .on('cancel', delayedResponseHandlers.cancel);


video.transcodeVideo(req)
  .then(function(result) {
      console.log(result);
      if(req.body.twitterName != null) {
        console.log('starting uploadMedia');
        var filePath = result;
        return new Promise(function(resolve, reject) {
          twitterClient.postMediaChunked({ file_path: filePath}, function (error, data, response) {
            var result = {
              success: !error ? true : false,
              error: error,
              media_id_string: data.media_id_string
            };
            !error ? resolve(result) : reject(result);
            console.log('resolved uploadMedia promise');
          });
        });
      } else { return new Promise(function(resolve, reject) {resolve(result);}); }
    })
    .then(function(result) {
      console.log(result);
      if(req.body.twitterName != null) {
        return new Promise(function(resolve, reject) {
          // set up resources we need for the status update
          var handleString = req.body.twitterName;
          var statusString = 'Bite my shiny, metal ass, ' + handleString;

          twitterClient.post('statuses/update',
            { 
              status: statusString,
              media_ids: [result.media_id_string]
            }, 
            function(error, data, response) {
              var result = {
                success: !error ? true : false,
                error: error,
                tweet_id: data.id
              };
              !error ? resolve(result) : reject(result);
              !error ? console.log('no error') : console.log('error');
            });
        });
      } else { return new Promise(function(resolve, reject) {resolve(result);}); }
    })
    .then(function(result) {
      if(req.body.email != null) {
        console.log('sending an email');
        return new Promise(function(resolve, reject) {
          var sendTo = req.body.email;
          var subject = 'Hunter Vision @ SXSW';
          var videoPath = result;
          var text = 'Hunters SyFy and Spotify have me seeing in Hunter Vision at the Spotify House @ SXSW!';
          var mailOptions = {
            from: 'huntersvisionspotify@reify.nyc',
            to: sendTo,
            subject: subject,
            text: text,
            attachments: [{
              filename: 'yourVideo.mp4',
              path    : videoPath,
            }]
          };
          
          transport.sendMail(mailOptions, function(error, info) {
            if(error) {
              return console.log(error);
            } else {
              console.log('Message sent: ' + info);
            }
            transport.close();
          });
        }); 
      }
    })
    .then(function(result) {
      delayedResponse.end(null, {success: true, tweet_id: result.tweet_id});
    });
});


app.use('/', router);
