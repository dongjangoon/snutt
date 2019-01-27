import log4js = require('log4js');
import property = require('@app/core/config/property');

let logPath = property.get("api.log4js.path");
let logDatePattern = property.get("api.log4js.datePattern");
let logLevel = property.get("api.log4js.logLevel");
let daysToKeep = property.get("api.log4js.daysToKeep");

if (process.env.NODE_ENV !== 'mocha') {
    log4js.configure({
        appenders: { 
            'stderr': { type : 'stderr', layout: { type: "basic" } },
            'file': {
                type: 'dateFile',
                filename: logPath,
                pattern: logDatePattern,
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
