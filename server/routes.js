'use strict';

var request = require('request');
const queryString = require('query-string');

var errors = require('./components/errors');

module.exports = function(app) {

  app.get('/auth/facebook', function(req, res) {
    var query = {};
    query.client_id = process.env.CLIENT_ID;
    query.client_secret = process.env.CLIENT_SECRET;
    query.redirect_uri = process.env.REDIRECT_URI || 'http://app.my-wifi.test:9001/auth/facebook';
    query.code = req.query.code;

    var url = 'https://graph.facebook.com/v2.12/oauth/access_token';
    request({url: url, qs: query}, function(err, response, body) {
      if(err) {
        // We ignore this error and log them in anyway;
        console.log(err);
      }

      var params = JSON.parse(req.query.state);
      if (response.statusCode !== 200) {
        console.warn(response.statusCode);
      }

      if (response.statusCode === 200) {
        var data = JSON.parse(response.body);
        params.code = data.access_token;
      }

      const parsedHash = queryString.stringify(params);
      console.log(parsedHash);
      res.redirect('/social?' + parsedHash);
    });
  });

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
