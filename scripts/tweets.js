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
  var uploadMedia = function(filepath) {

    return new Promise(function(resolve, reject) {
      // transform what we got in the request into the filepath
      console.log(filepath);
      var filePath = filepath;
      resolve({
        success: true,
        error: null,
        media_id_string: '708406346270576641'
      });

      //try {
        //twitterClient.postMediaChunked({ file_path: filePath}, function (error, data, response) {
          //var result = {
            //success: !error ? true : false,
            //error: error,
            //media_id_string: data.media_id_string
          //};
          //!error ? resolve(result) : reject(result);
        //});
      //}
      //catch(error) {
        //console.log(error);
        //resolve(error);
      //}
    });
  };

  var tweetStatusWithVideo = function(mediaIDString, requestBody) {

    return new Promise(function(resolve, reject) {
      try {
        // set up resources we need for the status update
        var handleString = requestBody.twitterName;
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
          });
      }
      catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };


  return {
    tweetStatusWithVideo: tweetStatusWithVideo,
    uploadMedia: uploadMedia
  };
};
