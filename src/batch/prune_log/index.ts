/**
 * 오래된 로그를 삭제합니다.
 * $ npm run prune_log
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */

require('module-alias/register');
require('@app/core/config/mongo');
require('@app/batch/config/log');

import FcmLogService = require('@app/core/fcm/FcmLogService');
import RefLectureQueryService = require('@app/core/lecture/RefLectureQueryService');
import * as log4js from 'log4js';
import SimpleJob from '../common/SimpleJob';
var logger = log4js.getLogger();

async function run() {
  let currentTimestamp = Date.now();
  let thresholdTimestamp = currentTimestamp - 1000 * 3600 * 24 * 180; // 180 days
  await FcmLogService.removeBeforeTimestamp(thresholdTimestamp);
  await RefLectureQueryService.removeQueryLogBeforeTimestamp(thresholdTimestamp);
}

async function main() {
  try {
    await new SimpleJob("prune_log", run).run();
  } catch (err) {
    logger.error(err);
  }
  
  // Wait for log4js to flush its logs
  log4js.shutdown(function() { process.exit(0); });
}

if (!module.parent) {
  main();
}
