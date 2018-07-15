import log4js = require('log4js');

if (process.env.NODE_ENV !== 'mocha') {
    log4js.configure({
        appenders: { 
            'stdout': { type : 'stdout', layout: { type: "basic" } }
        },
        categories: {
            default: { appenders: [ 'stdout' ], level: 'info' }
        }
    });
}
