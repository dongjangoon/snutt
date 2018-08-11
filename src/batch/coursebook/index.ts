/**
 * fetch.rb로부터 긁어온 txt 파일을 읽어 몽고 디비에 입력합니다.
 * $ node import_txt 2016 1
 * 
 * @author Hyeungshik Jung, zxzl@github
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */
require('module-alias/register')
require('@app/batch/config/log');
require('@app/core/config/mongo');

import { parseTagFromLectureList } from './data/parse';
import { compareLectures } from './data/compare';
import { notifyUpdated } from './data/notify';
import CourseBookService = require('@app/core/coursebook/CourseBookService');
import RefLectureService = require('@app/core/lecture/RefLectureService');
import NotificationService = require('@app/core/notification/NotificationService');
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import TagListService = require('@app/core/taglist/TagListService');
import SugangSnuService = require('./sugangsnu/SugangSnuService');
import * as log4js from 'log4js';
import SimpleJob from '../common/SimpleJob';
var logger = log4js.getLogger();

/**
 * 현재 수강편람과 다음 수강편람
 */
async function getUpdateCandidate(): Promise<Array<[number, number]>> {
  let recentCoursebook = await CourseBookService.getRecent();
  if (!recentCoursebook) {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth();
    let semester: number;
    if (month < 3) {
      semester = 4; // Winter
    } else if (month < 7) {
      semester = 1; // Spring
    } else if (month < 9) {
      semester = 2; // Summer
    } else {
      semester = 3; // Fall
    }
    logger.info("No recent coursebook found, infer from the current date.");
    logger.info("Inferred ", year, semester);
    return [[year, semester]];
  }
  let year = recentCoursebook.year;
  let semester = recentCoursebook.semester;

  let nextYear = year;
  let nextSemester = semester + 1;
  if (nextSemester > 4) {
    nextYear++;
    nextSemester = 1;
  }

  return [[year, semester],
  [nextYear, nextSemester]];
}


export async function fetchAndInsert(year: number, semesterIndex: number, fcm_enabled: boolean): Promise<void> {
  var semesterString = (['1', '여름', '2', '겨울'])[semesterIndex - 1];

  var noti_msg = year + "년도 " + semesterString + "학기 수강편람이 추가되었습니다.";

  logger.info("Fetching from sugang.snu.ac.kr...");
  let fetched = await SugangSnuService.getRefLectureList(year, semesterIndex);
  if (fetched.length == 0) {
    logger.warn("No lecture found.");
    return;
  }
  logger.info("Load complete with " + fetched.length + " courses");
  logger.info("Parsing tags...");
  let tags = parseTagFromLectureList(fetched);
  logger.info("Compare lectures...");
  let compared = await compareLectures(year, semesterIndex, fetched);
  if (compared.updated.length === 0 &&
    compared.created.length === 0 &&
    compared.removed.length === 0) {
    logger.info("Nothing updated.");
    return;
  }
  logger.info(compared.updated.length + " updated, " +
    compared.created.length + " created, " +
    compared.removed.length + " removed.");

  logger.info("Sending notifications...");
  await notifyUpdated(year, semesterIndex, compared, fcm_enabled);

  await RefLectureService.removeBySemester(year, semesterIndex);
  logger.info("Removed existing lecture for this semester");

  logger.info("Inserting new lectures...");
  var inserted = await RefLectureService.addAll(fetched);
  logger.info("Insert complete with " + inserted + " success and " + (fetched.length - inserted) + " errors");

  logger.info("Inserting tags from new lectures...");
  for (var key in tags) {
    if (tags.hasOwnProperty(key)) {
      tags[key].sort();
    }
  }
  await TagListService.merge({year: Number(year), semester: semesterIndex, tags: tags});
  logger.info("Inserted tags");

  logger.info("saving coursebooks...");
  /* Send notification only when coursebook is new */
  var existingDoc = await CourseBookService.get(Number(year), semesterIndex);
  if (!existingDoc) {
    await CourseBookService.add({
      year: Number(year),
      semester: semesterIndex,
      updated_at: new Date()
    });
    if (fcm_enabled) await NotificationService.sendGlobalFcmMsg("신규 수강편람", noti_msg, "batch/coursebook", "new coursebook");
    await NotificationService.add({
      user_id: null,
      message: noti_msg,
      type: NotificationTypeEnum.COURSEBOOK,
      detail: null,
      created_at: new Date()
    });
    logger.info("Notification inserted");
  } else {
    await CourseBookService.modifyUpdatedAt(existingDoc, new Date());
  }
  return;
}

async function run() {
  let cands: Array<[number, number]>;
  if (process.argv.length != 4) {
    cands = await getUpdateCandidate();
  } else {
    cands = [[parseInt(process.argv[2]), parseInt(process.argv[3])]];
  }
  for (let i = 0; i < cands.length; i++) {
    let year = cands[i][0];
    let semester = cands[i][1];
    try {
      await fetchAndInsert(year, semester, true);
    } catch (err) {
      logger.error(err);
      continue;
    }
  }
}

async function main() {
  try {
    await new SimpleJob("coursebook", run).run();
  } catch (err) {
    logger.error(err);
  }
  
  // Wait for log4js to flush its logs
  log4js.shutdown(function() { process.exit(0); });
}

if (!module.parent) {
  main();
}
