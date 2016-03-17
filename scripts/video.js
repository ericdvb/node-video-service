module.exports = function(router) {
  var fs = require('fs');
  var streamifier = require('streamifier');
  var ffmpeg = require('fluent-ffmpeg');
  var promise = require('promise');

  var transcodeVideo = function(req) {

    var outputFilename = req.file.filename.split('.')[0] + '.mp4';

    return new promise(function(resolve, reject) {
      try{
        var ffmpegCommand = ffmpeg()
          .input( __dirname + '/../uploads/' + req.file.filename )
          //.input( __dirname + '/../syfyBug.png')
          .output( __dirname + '/../processed/' + outputFilename )
          .format('mp4')
          .videoCodec('libx264')
          .size('720x?')
          .audioBitrate('128k')
          .videoBitrate('2048k')
          .audioCodec('aac')
          .addOption('-strict -2')
          .addOption('-vf', 'movie=' + __dirname + '/../syfyBug.png [watermark]; [watermark] scale=720:720[watermark]; [in][watermark] overlay=0:main_h-overlay_h-10 [out]')
          .on('start', function(command) {
            console.log('FFMpeg started by: ' + command);
          })
          //.on('codecData', function(codecData) {
            //console.log('codec data: ' + JSON.stringify(codecData))
          //})
          //.on('progress', function(p) {
            //console.log('progress: ' + JSON.stringify(p));
          //})
          .on('end', function() {
            resolve( __dirname + '/../processed/' + outputFilename );
          })
          .on('error', function(error) {
            reject(error);
          })
          .run();
      } catch(e) {
        console.log(e);
      }
    });
  }

  return {
    transcodeVideo: transcodeVideo
  }
};
