var express = require('express');
var connectLR = require('connect-livereload');

var app = express();
app.use( connectLR( { port: 35729 } ) );
app.use( express.static(__dirname + '/../'));

// ******* STATIC SERVER *******
app.listen( 4000, function() {
  console.log('started listening on 4000');
});

// ******* API ROUTES *******
// 
// Create our router
var router = express.Router();
router.post('/combine', function(req, res) {
  console.log(req);
})
