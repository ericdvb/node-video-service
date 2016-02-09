import express from 'express';
import connectLR from 'connect-livereload';

console.log(__dirname);
var app = express();
app.use( connectLR( { port: 35729 } ) );
app.use( express.static('../..') );
app.listen( 4000, function() {
  console.log('started listening on 4000');
});
