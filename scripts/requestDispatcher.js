module.exports = function() {
  var mongo = require('mongodb').MongoClient;
  var db = require('monk')('localhost/test');
  var tweets = require('./tweets.js')();
  
  // ******** MONGO SETUP ********
  // create a connection to our mongo database in db
  var mongoUrl = 'mongodb://localhost:27017/test';
  var running;

  var queueRequest = function(request) {
    //console.log('collection: ' + JSON.stringify(collection));
    var requestQueue = db.get('requests');
    var result = requestQueue.insert(request).then( function(result) {
      var result = {
        success: !error ? true : false,
        error: error,
        id: result._id 
      };
      return new Promise(function(resolve, reject) {
        resolve(result);
      }); 
    });

    return result;
  };

  var getNextRequest = function () {
    var requestQueue = db.get('requests');
    requestQueue.findOne({$or: [
        {mediaUpdated: {$eq: "false"}},
        {statusUpdated: {$eq: "false"}}
      ]},
      { sort: {lastAttempt: 1 } },
      function(e, doc){
        doc ? attemptRequest(doc) : console.log('queue is empty');
      });
  };

  var updateLastRequestAttempt = function(requestQueue, request) {
    return new Promise(function(resolve, reject) {
      requestQueue.update(request._id, {$set: {lastAttempt: Date.now()}}, function(e, result) {
        console.log(e);
        resolve(result);
      });
    });
  };

  var attemptRequest = function (request) {
    var requestQueue = db.get('requests');
    if(request.mediaUploaded == "false") {
      return tweets.uploadMedia(request.filePath)
      .then(function(result) {
        return new Promise(function(resolve, reject) {
          requestQueue.update(request._id, {$set: {mediaUploaded: "true", lastAttempt: Date.now(), mediaIDString: result.media_id_string}}, function(e) {
            console.log(e);
            resolve(result);
          });
        });
      })
      .catch(updateLastRequestAttempt(requestQueue, request))
      .then(function(result) {
        return tweets.tweetStatusWithVideo(result.media_id_string, request.twitterName);
      })
      .then(function(result) {
        return new Promise(function(resolve, reject) {
          requestQueue.update(request._id, {$set: {statusUpdated: "true"}}, function(e) {
            console.log(e);
            resolve(result);
          });
        });
      })
      .catch(updateLastRequestAttempt(requestQueue, request));
    } else if(request.statusUpdated == "false") {
      return tweets.tweetStatusWithVideo(request.mediaIDString, request.twitterName)
      .then(function(result) {
        return new Promise(function(resolve, reject) {
          requestQueue.update(request._id, {$set: {statusUpdated: "true"}}, function(e) {
            console.log(e);
            resolve(result);
          });
        });
      })
      .catch(updateLastRequestAttempt(requestQueue, request));
    }
  };

  var startDispatcher = function() {
    running = setInterval(getNextRequest, 60000);
  };

  var pauseDispatcher = function() {
    clearInterval(running);
  }

  return {
    queueRequest: queueRequest,
    fireRequest: getNextRequest,
    start: startDispatcher,
    pause: pauseDispatcher
  };
}();
