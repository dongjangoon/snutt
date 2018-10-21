import express = require("express");
import morgan = require("morgan");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import path = require("path");
import cors = require("cors");
import http = require('http');
import log4js = require('log4js');

import RootRouter = require('@app/api/routes/RootRouter');
import property = require('@app/core/config/property');
import ApiErrorHandler from "../middleware/ApiErrorHandler";

var logger = log4js.getLogger();
var app = express();

// view engine setup
app.set('views', path.join(__dirname, '..', 'views'));
app.use('/asset', express.static(path.join(__dirname, '..', 'asset')));
//app.set('view engine', 'jade');
app.engine('.html', require('ejs').renderFile);

// X-Forwarded-For 헤더를 신뢰할 주소. 앞단에 nginx 프록시를 둘 경우 필요함. localhost만을 활성화한다
app.set('trust proxy', 'loopback')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') !== 'mocha')
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
// Only for development
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', RootRouter);

app.use(ApiErrorHandler);

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
