'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var fs  = require("fs");
var express = require('express');
var config = require('./config/environment');
var oauth = require('oauth');
var app = express();
var server = require('http').createServer(app);
var session = require('express-session');
const callback_url = process.env.TWITTER_CALLBACK || "http://app.my-wifi.test:9001/auth/twitter/callback";

require('./config/express')(app);

app.use(session({
  secret: 'keyboard cat',
  cookie: {}
}))

var consumer = new oauth.OAuth(
  "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
  (process.env.TWITTER_CONSUMER_KEY || '123'), (process.env.TWITTER_CONSUMER_SECRET || '123'), "1.0A", callback_url, "HMAC-SHA1");

app.get('/auth/twitter', function(req, res) {
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token");
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+oauthToken);
    }
  });
});

app.get('/home', function(req, res){
  consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true&include_email=true", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
    if (error) {
      console.log(error, req.session);
      res.redirect('/auth/twitter');
    } else {
      var parsedData = JSON.parse(data);
      console.log(parsedData);
      res.send('You are signed in: ' + parsedData.screen_name);
    }
  });
});

app.get('/auth/twitter/callback', function(req, res) {
  consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      console.log(error);
      res.send("Error getting OAuth access token");
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      res.redirect('/home');
    }
  });
});

require('./routes')(app);

server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

exports = module.exports = app;
