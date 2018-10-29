import redis = require('redis');
import log4js = require('log4js');
import property = require('@app/core/config/property');
import RedisUtil = require('@app/core/redis/RedisUtil');
let logger = log4js.getLogger();

let client = redis.createClient({
    port: property.get('redis.port')
});

client.on('connect', async function() {
    logger.info('Redis client connected');
    global['redisClient'] = client;

    let maxmemory = await RedisUtil.configGet('maxmemory');
    let maxmemoryPolicy = await RedisUtil.configGet('maxmemory-policy');
    logger.info("Redis maxmemory: " + maxmemory);
    logger.info("Redis maxmemory-policy: " + maxmemoryPolicy);
    if (Number(maxmemory) === 0) {
        logger.error("Redis maxmemory infinite. It's highly recommended to set maxmemory");
    }
    if (maxmemoryPolicy !== "allkeys-lru") {
        logger.error("Redis eviction policy is not allkeys-lru");
    }
});

client.on('error', function (err) {
    logger.error('Redis client error: ' + err);
});
