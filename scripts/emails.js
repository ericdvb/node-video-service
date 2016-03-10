module.exports = function(router) {
  var bodyParser = require('body-parser');
  var nodemailer = require('nodemailer');
  var ses = require('nodemailer-ses-transport');
  var sendgrid = require('nodemailer-sendgrid-transport');
  var sendgridOptions = require('../settings.json').sendgrid;

  // Set up nodemailer mail transport
  //var transport = nodemailer.createTransport(ses({
    //accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  //}));
  var transport = nodemailer.createTransport(sendgrid({
    auth: { api_key: sendgridOptions.api_key }
  }));

  // create route that shares a link to a video via e-mail
  router.post('/emails', bodyParser.json(), function(req, res) {
    var sendTo = req.body.sendTo;
    var subject = 'Here\'s your new video!';
    var videoLink = req.body.videoID;
    var text = 'Hi! Your new video is attached.'
    var mailOptions = {
      from: 'eric@bodegapapi.com',
      to: sendTo,
      subject: subject,
      text: text,
      attachments: [{
        filename: 'yourVideo.mp4',
        path    : __dirname + '/../uploads/' + videoLink + '.mp4',
      }]
    };

    console.log(JSON.stringify(mailOptions));

    transport.sendMail(mailOptions, function(error, info) {
      if(error) {
        return console.log(error);
      } else {
        console.log('Message sent: ' + info.response);
      }
      transport.close();
    });
  });
}
