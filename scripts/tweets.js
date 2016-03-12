module.exports = function(router) {

  var Twit = require('twit');
  var bodyParser = require('body-parser');
  var DelayedResponse = require('http-delayed-response'); 

  // Twit setup
  var twitterSettings = require('../settings.json').twitter;
  var twitterClient = new Twit(twitterSettings);

  /**
   * function uploadMedia
   * Uploads specified file to the twitter /media/upload endpoint
   *
   */
  var uploadMedia = function(filePath, req) {
      if(req.body.twitterName != null) {
        console.log('starting uploadMedia');
        return new Promise(function(resolve, reject) {
          console.log('inside the uploadMedia promise');
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
  };

  var tweetStatusWithVideo = function(mediaIDString, req) {
    if(req.body.twitterName != null) {
      console.log('starting tweetStatusWithVideo');
      return new Promise(function(resolve, reject) {
        console.log('inside the tweetStatusWithVideo promise');
        // set up resources we need for the status update
        var handleString = req.body.twitterName;
        var statusString = 'Bite my shiny, metal ass, ' + handleString;

        twitterClient.post('statuses/update',
          { 
            status: statusString,
            media_ids: [mediaIDString]
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
  };


  return {
    tweetStatusWithVideo: tweetStatusWithVideo,
    uploadMedia: uploadMedia
  };
};
