/**
 * 오래된 로그를 삭제합니다.
 * $ npm run prune_log
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */

require('module-alias/register')

import { MongoClient, Db as MongoDb, DeleteWriteOpResultObject } from 'mongodb';
import config = require('core/config');
import {getLogFilePath} from 'core/log';
import * as log4js from 'log4js';
var logger = log4js.getLogger();

log4js.configure({
  appenders: { 
    'stdout': { type : 'stdout' },
    'file' : { type : 'file',
        filename: getLogFilePath('prune_log.log'),
        layout: { type: "basic" },
        maxLogSize: 20480,
        backups: 10 }
  },
  categories: {
    default: { appenders: [ 'stdout', 'file' ], level: 'info' }
  }
});

function getMongoClient(): Promise<MongoClient> {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(config.mongoUri, function(err, db) {
      if (err) return reject(err);
      return resolve(db);
    });
  })
}

function remove(db: MongoDb, collectionName: string, query: any): Promise<DeleteWriteOpResultObject> {
  return new Promise(function(resolve, reject) {
    db.collection(collectionName).deleteMany(query, null, function(err, result) {
      if (err) return reject();
      else return resolve(result);
    });
  });
}

async function deleteQueryLog(db: MongoDb) {
  let currentTimestamp = Date.now();
  let thresholdTimestamp = currentTimestamp - 1000 * 3600 * 24 * 180; // 180 days
  let query = { timestamp: { $lt: thresholdTimestamp }};
  logger.info("db.query_logs.remove(" + JSON.stringify(query) + ")");
  let result = await remove(db, 'query_logs', query);
  logger.info(String(result));
}

async function deleteFcmLog(db: MongoDb) {
  let currentDate = new Date();
  let currentTimestamp = Date.now();
  let thresholdTimestamp = currentTimestamp - 1000 * 3600 * 24 * 180; // 180 days
  let thresholdDate = new Date(thresholdTimestamp);
  let query = { date: { $lt: thresholdDate }};
  logger.info("db.fcmlogs.remove(" + JSON.stringify(query) + ")");
  let result = await remove(db, 'fcmlogs', query);
  logger.info(String(result));
}

async function main() {
  try {
    let client = await getMongoClient();
    let db = client.db("snutt");
    await deleteFcmLog(db);
    await deleteQueryLog(db);
    client.close();
  } catch (err) {
    logger.error(err);
  }
}

if (!module.parent) {
  main();
}
