var express = require('express');
var connectLR = require('connect-livereload');
var bodyParser = require('body-parser');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var streamBuffers = require('stream-buffers');
var streamifier = require('streamifier');

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
  var ext = req.body.split(';')[0].split(':')[1].split('/')[1];
  var data = req.body.split(';')[1].split(',')[1];
  var readableStreamAudio = new streamBuffers.ReadableStreamBuffer({
    frequency: 10,
    chunkSize: 2048
  });
  var audioBuffer = new Buffer(data, 'base64');
  var readableAudioStream = streamifier.createReadStream(audioBuffer);
  var ffmpegCommand = ffmpeg()
    .input(readableAudioStream)
    .input('/Users/ewillenson/work/soundboard/ScareTactics.mp4')
    .output('/Users/ewillenson/work/soundboard/vignetteTest.mp4')
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
    })
    .on('error', function(error) {
      console.log('Error ' + error.message);
    })
    .run();
});

router.get('/testroute', function(req, res) {
  console.log('request received!');
})

app.use(bodyParser.text({ limit : '50mb' }));
app.use('/', router);
