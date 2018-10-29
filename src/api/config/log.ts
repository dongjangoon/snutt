import log4js = require('log4js');
import property = require('@app/core/config/property');

if (process.env.NODE_ENV !== 'mocha') {
    log4js.configure({
        appenders: { 
            'stderr': { type : 'stderr', layout: { type: "basic" } }
        },
        categories: {
            default: { appenders: [ 'stderr' ], level: 'error' }
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
