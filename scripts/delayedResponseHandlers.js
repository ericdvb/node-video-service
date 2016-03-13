module.exports = {
    done: function(tweet_id) {
      console.log('inside the done handler');
      var responseJSON = {
        success: true,
        tweet_id: tweet_id
      }
      res.send( responseJSON );
      res.end();
    },

    error: function(result) {
      var responseJSON = {
        success: false,
        error: result.error
      }
      res.status(result.error.statusCode);
      res.write( JSON.stringify( responseJSON ) );
      res.end();
    },
    
    cancel: function() {
      var responseJSON = {
        success: false,
        error: 'Error: response took too long' 
      }
      res.status(504);
      res.write( JSON.stringify( responseJSON ) );
      res.end();
    }
};
