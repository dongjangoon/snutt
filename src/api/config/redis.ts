import log4js = require('log4js');
import RedisUtil = require('@app/core/redis/RedisUtil');

let logger = log4js.getLogger();

RedisUtil.pollRedisClient().then(function() {
  logger.info('Flushing all redis data');
  RedisUtil.flushall();
});
