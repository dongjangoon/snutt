require('module-alias/register');
require('@app/batch/config/log');
require('@app/core/config/mongo');

import winston = require('winston');

import LambdaJobBuilder from '../common/LambdaJobBuilder';
import Lecture from '@app/core/lecture/model/Lecture';
import { timeJsonToMask } from '@app/core/timetable/util/TimePlaceUtil';
import RefLectureService = require('@app/core/lecture/RefLectureService');
import TimetableService = require('@app/core/timetable/TimetableService');

let logger = winston.loggers.get('default');

async function reader(executionContext): Promise<{type: string, lecture: Lecture}[]> {
    let year: number = executionContext.year;
    let semesterIndex: number = executionContext.semesterIndex;

    let lectureWithTypeList: {type: string, lecture: Lecture}[] = [];
    logger.info("Loading " + year + " " + semesterIndex);

    let refLectureList = await RefLectureService.getBySemester(year, semesterIndex);
    for (let refLecture of refLectureList) {
        lectureWithTypeList.push({type: "RefLecture", lecture: refLecture});
    }
    logger.info("RefLecture loaded");

    let tableList = await TimetableService.getBySemester(year, semesterIndex);
    for (let table of tableList) {
        for (let userLecture of table.lecture_list) {
            lectureWithTypeList.push({type: "UserLecture", lecture: userLecture});
        }
    }
    logger.info("UserLecture loaded");

    logger.info(lectureWithTypeList.length + " Loaded");
    return lectureWithTypeList;
}

async function processor(lectureWithType: {type: string, lecture: Lecture}): Promise<{type: string, result: string, lecture: Lecture}> {
    let type = lectureWithType.type;
    let lecture = lectureWithType.lecture;

    let expectedTimeMask = timeJsonToMask(lecture.class_time_json);
    let actualTimeMask = lecture.class_time_mask;
    for (let i=0; i<7; i++) {
        if (expectedTimeMask[i] !== actualTimeMask[i]) {
            return {
                type: type,
                lecture: lecture,
                result: "ERROR"
            };
        }
    }
    return {
        type: type,
        lecture: lecture,
        result: "OK"
    };
}

async function writer(processed: {type: string, result: string, lecture: Lecture}): Promise<void> {
    if (processed.result !== "OK") {
        logger.error("Timemask does not match (type: " + processed.type +
            ", _id: " + processed.lecture._id + ", title: " + processed.lecture.course_title + ")");
    }
}

async function main() {
    let year = parseInt(process.argv[2]);
    let semesterIndex = parseInt(process.argv[3]);
    await new LambdaJobBuilder("VerifyTimeMaskJob")
        .reader(reader)
        .processor(processor)
        .writer(writer)
        .run({year: year, semesterIndex: semesterIndex});

    setTimeout(() => process.exit(0), 1000);
}
  
if (!module.parent) {
    main();
}
