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


// AWS setup
AWS.config.region = 'us-east-1';
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

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

// Create the route to submit audio files for combining
router.post('/combine', function(req, res) {
  console.log('received a request to combine');
  
  // create our response promise, since we have to wait for ffmpeg to finish
  // set the content-type header to application/json using .json()
  var delayedResponse = new DelayedResponse(req, res).json();

  // extract some information from the repsonse body - the audio from the client
  // was sent as a urlencoded string, with the file extension, type, and encoding first
  var ext = req.body.split(';')[0].split(':')[1].split('/')[1];
  var data = req.body.split(';')[1].split(',')[1];

  // put the data from the audio file into a buffer
  var audioBuffer = new Buffer(data, 'base64');
  
  // turn that buffer into a node readable stream
  var readableAudioStream = streamifier.createReadStream(audioBuffer);

  // Error handler for our promises
  var onRejected = function(error) {
    console.log('error: ' + error);
  };

  // Create a writable stream for the output of ffmpeg 
  // not using this...for whatever reason it doesn't seem to be working.
  // probably because the streamBuffers implementation of writableStreamBuffer
  // isn't what fluent-ffmpeg is expecting
  //var ffmpegOutputStream = new streamBuffers.WritableStreamBuffer({
    //initialSize: (5000 * 1024),
    //incrementAmount: (10*1024)
  //});

  // create a promise to represent the final video
  var videoPromise = new Promise( function(resolve, reject) {

    // Use the unix timestamp in milliseconds as the filename
    var outputFileName = Date.now();
    var ffmpegCommand = ffmpeg()
      // use the readableStream containing the audio as an input
      .input(readableAudioStream)
      .input( __dirname + '/../ScareTactics.mp4' )
      .output( __dirname + '/../' + outputFileName + '.mp4')
      // If you want to use a video filter, specify here
      //.videoFilter([
        //{
          //filter: 'vignette',
          //options: { angle: 'PI/2' }
        //}
      //])
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
        console.log('done with video ' + outputFileName + '.mp4');
        resolve( __dirname + '/../' + outputFileName + '.mp4' );
      })
      .on('error', function(error) {
        reject(error);
      })
      .run();
  });

  videoPromise
    .then( function(value) {
      console.log('expected value is a file path: ' + value);
      return new Promise( function(resolve, reject) {
        resolve({
          readableVideoStream: fs.createReadStream(value),
          fileName: value.slice(value.lastIndexOf('/') + 1, value.lastIndexOf('.'))
        });
      });
    }) 
    .then( function(value) {
      return new Promise( function(resolve, reject) {
        var s3obj = new AWS.S3({ params: { Bucket: 'pewdiefi-soundboard-test', Key: value.fileName } });
        s3obj.upload({ Body: value.readableVideoStream })
          .on('httpUploadProgress', function(evt) { console.log(evt); })
          .send(function(err, data) { 
            if(!err) {
              resolve(data.Location);
            } else {
              reject(err);   
            }
          });
      });
    }, onRejected)
    .then( function(value) {
      delayedResponse.end(null, value);
      return value;
    });


  // add handlers for what to do when we resolve our response promise, or
  // the response promise times out
  delayedResponse.on('done', function(results) {
    res.write( JSON.stringify({
        success: true,
        path: results
      })
    );
    res.end();
  })
  .on('cancel', function() {
    res.write('response was cancelled');
    res.end();
  });
  
  // kick off our response processing
  delayedResponse.start(10000, 10000);
});

app.use(bodyParser.text({ limit : '50mb' }));
app.use('/', router);
