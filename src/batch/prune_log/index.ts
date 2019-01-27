/**
 * 오래된 로그를 삭제합니다.
 * $ npm run prune_log
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */

require('module-alias/register');
require('@app/batch/config/log');
require('@app/core/config/mongo');

import FcmLogService = require('@app/core/fcm/FcmLogService');
import RefLectureQueryService = require('@app/core/lecture/RefLectureQueryService');
import SimpleJob from '../common/SimpleJob';

async function run() {
  let currentTimestamp = Date.now();
  let thresholdTimestamp = currentTimestamp - 1000 * 3600 * 24 * 180; // 180 days
  await FcmLogService.removeBeforeTimestamp(thresholdTimestamp);
  await RefLectureQueryService.removeQueryLogBeforeTimestamp(thresholdTimestamp);
}

async function main() {
  await new SimpleJob("prune_log", run).run();
}

if (!module.parent) {
  main();
}
