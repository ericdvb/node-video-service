var express = require('express');
var connectLR = require('connect-livereload');
var bodyParser = require('body-parser');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var streamBuffers = require('stream-buffers');
var streamifier = require('streamifier');
var DDPServer = require('ddp-server'); 
var DelayedResponse = require('http-delayed-response'); 
var Promise = require('promise');
var AWS = require('aws-sdk');

var app = express();

app.listen( 4000, function() {
  console.log('started listening on 4000');
});

// ******* STATIC SERVER *******
app.use( connectLR( { port: 35729 } ) );
app.use( express.static(__dirname + '/../'));

// ******* API ROUTES *******
// 
// Create our router
var router = express.Router();
router.post('/combine', function(req, res) {
  console.log('received a request to combine');
  
  // create our response promise, since we have to wait for ffmpeg to finish
  var delayedResponse = new DelayedResponse(req, res);

  // extract some information from the repsonse body - the audio from the client
  // was sent as a urlencoded string, with the file extension, type, and encoding first
  var ext = req.body.split(';')[0].split(':')[1].split('/')[1];
  var data = req.body.split(';')[1].split(',')[1];

  // put the data from the audio file into a buffer
  var audioBuffer = new Buffer(data, 'base64');
  
  // turn that buffer into a node readable stream
  var readableAudioStream = streamifier.createReadStream(audioBuffer);

  // encode the video and store the path in videoPromise
  // TODO: store the encoded video in an s3 bucket, return that address
  var videoPromise = new Promise( function(resolve, reject) {
    console.log('inside the promise function');
    var ffmpegCommand = ffmpeg()
      .input(readableAudioStream)
      .input( __dirname + '/../ScareTactics.mp4' )
      .output( __dirname + '/../vignetteTest.mp4')
      .videoFilter([
        {
          filter: 'vignette',
          options: { angle: 'PI/2' }
        }
      ])
      .on('start', function(command) {
        console.log('FFMpeg started by: ' + command);
      })
      .on('codecData', function(codecData) {
        console.log('codec data: ' + JSON.stringify(codecData))
      })
      .on('progress', function(p) {
        console.log('progress: ' + JSON.stringify(p));
      })
      .on('end', function() {
        console.log('all done');
        resolve( __dirname + '/../vignetteTest.mp4' );
        delayedResponse.end(videoPromise);
      })
      .on('error', function(error) {
        reject(error);
      })
      .run();
  });

  // add handlers for what to do when we resolve our response promise, or
  // the response promise times out
  delayedResponse.on('done', function(results) {
    res.write(results);
    res.end();
  })
  .on('cancel', function() {
    res.write('response was cancelled');
    res.end();
  });
  
  // kick off our response processing
  delayedResponse.start(10000, 10000);
});

router.get('/testroute', function(req, res) {
  console.log('request received!');
})

app.use(bodyParser.text({ limit : '50mb' }));
app.use('/', router);
