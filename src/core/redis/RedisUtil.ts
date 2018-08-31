import redis = require('redis');
import log4js = require('log4js');
import RedisClientError from './error/RedisClientError';
let logger = log4js.getLogger();

let redisClient: redis.RedisClient = global['redisClient'];

function checkRedisClient() {
    if (!redisClient) {
        if (global['redisClient']) {
            redisClient = global['redisClient'];
        } else {
            throw new RedisClientError("Redis not connected");
        }
    }
}

export function configGet(key: string): Promise<string> {
    checkRedisClient();
    return new Promise(function (resolve, reject) {
        redisClient.sendCommand("config", ["get", key], function(err, values: string[]) {
            if (err) {
                reject(err);
            } else {
                resolve(values[1]);
            }
        })
    });
}

export function flushall(): Promise<string> {
    checkRedisClient();
    return new Promise(function (resolve, reject) {
        redisClient.flushall(function(err, value: string) {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        })
    });
}

export function get(key: string): Promise<string> {
    checkRedisClient();
    return new Promise(function (resolve, reject) {
        redisClient.get(key, function(err, value: string) {
            if (err) {
                reject(err);
            } else {
                logger.info('get ' + key);
                resolve(value);
            }
        })
    })
}

export function set(key: string, value: string): Promise<void> {
    checkRedisClient();
    return new Promise(function (resolve, reject) {
        redisClient.set(key, value, function(err) {
            if (err) {
                reject(err);
            } else {
                logger.info('set ' + key);
                resolve();
            }
        })
    })
}
