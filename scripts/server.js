var express = require('express');
var connectLR = require('connect-livereload');
var bodyParser = require('body-parser');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');

var app = express();

// ******* STATIC SERVER *******
app.use( express.static(__dirname + '/../'));
app.use( connectLR( { port: 35729 } ) );

// ******* PARSER *******
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ******* API ROUTES *******
// 
// Create our router
var router = express.Router();
router.post('/combine', function(req, res) {
  console.log('received a request to combine');
})

//router.get('/', function(req, res) {
  //res.json({ message: 'hooray!' });
//});

router.get('/testroute', function(req, res) {
  console.log('request received!');
})

app.use('/', router);

app.listen( 4000, function() {
  console.log('started listening on 4000');
});
