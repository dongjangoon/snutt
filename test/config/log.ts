import winston = require('winston');

winston.loggers.add('default', {
    level: 'debug',
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.printf(info => `[${info.timestamp}] [${info.level}] ${(typeof info.message === 'string') ? info.message : JSON.stringify(info.message)}`)
    )
});
