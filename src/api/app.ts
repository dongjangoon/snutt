require('module-alias/register');
require('@app/api/config/log');
require('@app/core/config/mongo');
require('@app/core/config/redis');
require('@app/api/config/redis');
export = require('@app/api/config/express');
