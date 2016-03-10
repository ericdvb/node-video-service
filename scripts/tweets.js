module.exports = function(router) {

var Twit = require('twit');
var bodyParser = require('body-parser');
var DelayedResponse = require('http-delayed-response'); 

// Twit setup
var twitterSettings = require('../settings.json').twitter;
var twitterClient = new Twit(twitterSettings);

// Create route for POSTing new media to media/update twitter endpoint
// and then posting status update
router.post( '/tweets', bodyParser.text(), (req, res, next) => {
  console.log('request to tweet video');
  
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
};
