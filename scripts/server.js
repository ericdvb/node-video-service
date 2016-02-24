var express = require('express');
var connectLR = require('connect-livereload');
var bodyParser = require('body-parser');
var ffmpeg = require('fluent-ffmpeg');

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
router.post('/combine', bodyParser.urlencoded({ extended: false }), function(req, res) {
  console.log('received a request to combine');
  console.log(req.body);
});

router.get('/testroute', function(req, res) {
  console.log('request received!');
})

app.use('/', router);
