import log4js = require('log4js');
import property = require('@app/core/config/property');

let logPath = property.get("log4js.path");
let logPattern = property.get("log4js.pattern");
let logLevel = property.get("log4js.logLevel");
let daysToKeep = property.get("log4js.daysToKeep");

if (process.env.NODE_ENV !== 'mocha') {
    log4js.configure({
        appenders: { 
            'stderr': { type : 'stderr', layout: { type: "basic" } },
            'file': {
                type: 'dateFile',
                filename: logPath,
                pattern: logPattern,
                daysToKeep: daysToKeep,
                compress: true,
                alwaysIncludePattern: true
            }
        },
        categories: {
            default: { appenders: [ 'stderr', 'file' ], level: logLevel }
        }
    });
} else {
    log4js.configure({
        appenders: { 
            'stderr': { type : 'stderr' }
        },
        categories: {
            default: { appenders: [ 'stderr' ], level: 'debug' }
        }
    });
}
