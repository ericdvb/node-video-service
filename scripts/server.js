var express = require('express');
var multer = require('multer');
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
var Twit = require('twit');

var twitterSettings = require('../settings.json').twitter;
var twitterClient = new Twit(twitterSettings);

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

// AWS setup
AWS.config.region = 'us-east-1';

//you need to export your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
//as environment vars
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
router.post('/combine', bodyParser.text({ limit : '50mb' }), function(req, res) {
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
    // once our video promise resolves... 
    .then( function(filePath) {
      // make a new promise with the 
      return new Promise( function(resolve, reject) {
        resolve({
          readableVideoStream: fs.createReadStream(filePath),
          fileName: value.slice(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
        });
      });
    }) 
    .then( function(result) {
      return new Promise( function(resolve, reject) {
        var s3obj = new AWS.S3({ params: { Bucket: 'pewdiefi-soundboard-test', Key: result.fileName } });
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

// Create route for POSTing video for processing
router.post( '/video', upload.single('video'), function(req, res, next) {
  console.log(req.file);
  req.file == undefined ? res.append('Status', 200) : res.set('Status-Code', 500);
  res.end();
});

// Create route for POSTing new media to media/update twitter endpoint
// and then posting status update
router.post( '/tweets', bodyParser.text(), (req, res, next) => {
  console.log('request to upload video');
  
  // create our response promise
  // set the content-type header to application/json using .json()
  var delayedResponse = new DelayedResponse(req, res).json();
  
  // transform what we got in the request into the filepath
  var filePath = __dirname + '/../uploads/' + req.body;
  filePath = __dirname + '/../uploads/1457557560220.mp4';

  console.log('path to video to upload: ' + filePath);


  var twitterPromise = new Promise(function(resolve, reject) {
    // start the request to twitter endpoint...
    try {
      twitterClient.postMediaChunked({ file_path: filePath}, function (error, data, response) {
        delayedResponse.end(error);
        if(error) {
          console.log(error);
          reject(error)
        } else {
          // use if you need to see response data for some reason
          //console.log(response);
          //console.log(data);
          resolve(data.media_id_string);
        }
      });
    }
    catch(error) {
      console.log(error);
      delayedResponse.end(error, null)
      reject(error);
    }
  }).then( function(mediaIDString) {
    return new Promise( function(resolve, reject) {
      try {
        twitterClient.post('statuses/update',
          { 
            status: 'Bite my shiny, metal ass!',
            media_ids: [mediaIDString]
          }, 
          function(error, data, response) {
            delayedResponse.end(error, data);
            if(!error) {
              console.log(data);
              resolve(data.id);
            } else {
              console.log(error);
              reject(error);
            }
          });
      }
      catch (error) {
        console.log(error);
        reject(error);
      }
    });
  });

  delayedResponse.on('done', function(results) {
    var responseJSON = {
      success: true,
      tweet_id: results.id
    }
    res.write( JSON.stringify( responseJSON ) );
    res.end();
  })
  .on('error', function(error) {
    var responseJSON = {
      success: false,
      error: error
    }
    res.status(error.statusCode);
    res.write( JSON.stringify( responseJSON ) );
    res.end();
  })
  .on('cancel', function() {
    var responseJSON = {
      success: false,
      error: 'Error: response took too long' 
    }
    res.status(504);
    res.write( JSON.stringify( responseJSON ) );
    res.end();
  });

  delayedResponse.start(10000, 10000);
});

//app.use(bodyParser.text({ limit : '50mb' }));
app.use('/', router);
