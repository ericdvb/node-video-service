module.exports = function(router) {
  var bodyParser = require('body-parser');
  var nodemailer = require('nodemailer');
  var ses = require('nodemailer-ses-transport');
  var sendgrid = require('nodemailer-sendgrid-transport');
  var sendgridOptions = require('../settings.json').sendgrid;

  // Set up nodemailer mail transport
  var transport = nodemailer.createTransport(sendgrid({
    auth: { api_key: sendgridOptions.api_key }
  }));

  var createMessage = function(videoPath, req){
    var sendTo = req.body.email;
    var subject = 'Hunter Vision @ SXSW';
    var text = 'Hunters SyFy and Spotify have me seeing in Hunter Vision at the Spotify House @ SXSW!';
    var mailOptions = {
      from: 'huntersvisionspotify@reify.nyc',
      to: sendTo,
      subject: subject,
      text: text,
      attachments: [{
        filename: 'yourVideo.mp4',
        path    : videoPath,
      }]
    };

    return mailOptions;
  };

  var sendMail = function(mailOptions) {
    console.log('inside sendMail');
    return new Promise(function(resolve, reject) {
      transport.sendMail(mailOptions, function(error, info) {
        var result = {
          success: !error ? true : false,
          error: error
        };
        !error ? resolve(result) : reject(result);
        transport.close();
      });
    });
  };

  return {
    createMessage: createMessage,
    sendMail: sendMail
  };
};
