/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var fs  = require("fs");

// var options = {
//   key: fs.readFileSync('/Users/simonmorley/mywifi.keys/private.key'),
//   cert: fs.readFileSync('/Users/simonmorley/mywifi.keys/public.pem'),
//   // ca: fs.readFileSync('./ssl/gd_bundle.crt')
// };

var express = require('express');
var config = require('./config/environment');
// Setup server
var app = express();
var server = require('http').createServer(app);
// var httpsserver = require('https').createServer(options, app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// httpsserver.listen(9999, config.ip, function () {
//   console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
// });

// Expose app
exports = module.exports = app;
