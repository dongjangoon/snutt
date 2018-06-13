/**
 * HTTP 서버를 실행하는
 * 메인 엔트리
 */
require('module-alias/register');
require('@app/core/config/mongo');
require('@app/api/config/log');

import express = require("express");
import morgan = require("morgan");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import path = require("path");
import cors = require("cors");
import http = require('http');
import log4js = require('log4js');

import routes = require('@app/api/routes');
import property = require('@app/core/config/property');

var logger = log4js.getLogger();
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.engine('.html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') !== 'mocha')
  app.use(morgan('tiny'));
// Only for development
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/asset', express.static(__dirname + '/asset'));
app.use('/', routes);
// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
*/

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development' ||
  app.get('env') === 'mocha') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

/**
 * Get port from environment and store in Express.
 */

var port = property.port || '3000';
var host = property.host || 'localhost';
app.set('port', port);
app.set('host', host);

if (process.env.NODE_ENV != 'mocha') {
    var server = createServer();
}


/**
 * Create server.
 */
function createServer(): http.Server {
  var protocol = "http";
  var server = http.createServer(app);
  server.listen(port, host, function() {
    logger.info("Server listening on http://" + host + ":" + port);
  });
  server.on('error', onError);
  server.on('listening', onListening);
  return server;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  logger.debug('Listening on ' + bind);
}

export = app;
