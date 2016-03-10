var express = require('express');
var connectLR = require('connect-livereload');

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

// Create our routes
require('./audio.js')(router);
require('./video.js')(router);
require('./tweets.js')(router);
require('./emails.js')(router);

app.use('/', router);
