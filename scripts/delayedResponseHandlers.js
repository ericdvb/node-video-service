module.exports = {
    done: function(result) {
      var responseJSON = {
        success: true,
        tweet_id: result.tweet_id
      }
      res.write( JSON.stringify( responseJSON ) );
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
