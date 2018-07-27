import log4js = require('log4js');

import Timetable from "./model/Timetable";
import DuplicateTimetableTitleError from "./error/DuplicateTimetableTitleError";
import ObjectUtil = require('@app/core/common/util/ObjectUtil');
import TimetableRepository = require('./TimetableRepository');

import Color = require('../color');
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import LectureService = require('@app/core/lecture/LectureService');
import RefLectureService = require('@app/core/lecture/RefLectureService');
import UserLectureService = require('@app/core/lecture/UserLectureService');
import UserLecture from '@app/core/lecture/model/UserLecture';
import RefLectrureNotFoundError from "../lecture/error/RefLectureNotFoundError";
import WrongRefLectureSemesterError from "./error/WrongRefLectureSemesterError";
import DuplicateLectureError from "./error/DuplicateLectureError";
import TimetableNotFoundError from "./error/TimetableNotFoundError";
import InvalidLectureUpdateRequestError from './error/InvalidLectureUpdateRequestError';
import LectureTimeOverlapError from './error/LectureTimeOverlapError';
import CustomLectureResetError from './error/CusromLectureResetError';
import NotCustomLectureError from './error/NotCustomLectureError';
import AbstractTimetable from './model/AbstractTimetable';
import TimetableNotEnoughParamError from './error/TimetableNotEnoughParamError';
import UserLectureNotFoundError from './error/UserLectureNotFoundError';

let logger = log4js.getLogger();

export async function copy(timetable: Timetable): Promise<void> {
    for (let trial = 1; true; trial++) {
        let newTitle = timetable.title + " (" + trial + ")";
        try {
          return await copyWithTitle(timetable, newTitle);
        } catch (err) {
          if (err instanceof DuplicateTimetableTitleError) {
            continue;
          }
          throw err;
        }
    }
}

export async function copyWithTitle(src: Timetable, newTitle: string): Promise<void> {
    if (newTitle === src.title) {
        throw new DuplicateTimetableTitleError(src.user_id, src.year, src.semester, newTitle);
    }
    if (await TimetableRepository.findByUserIdAndSemesterAndTitle(src.user_id, src.year, src.semester, newTitle)) {
        throw new DuplicateTimetableTitleError(src.user_id, src.year, src.semester, newTitle);
    }
    
    let copied = ObjectUtil.deepCopy(src);
    ObjectUtil.deleteObjectId(copied);
    copied.title = newTitle;
    copied.updated_at = Date.now();
    await TimetableRepository.insert(copied);
}

export async function addRefLecture(timetable: Timetable, lectureId: string): Promise<void> {
  let lecture = await RefLectureService.getByMongooseId(lectureId);
  if (!lecture) throw new RefLectrureNotFoundError();
  if (lecture.year != timetable.year || lecture.semester != timetable.semester) {
    throw new WrongRefLectureSemesterError(lecture.year, lecture.semester);
  }
  let colorIndex = getAvailableColorIndex(timetable);
  let userLecture = UserLectureService.fromRefLecture(lecture, colorIndex);
  await addLecture(timetable, userLecture);
}

export async function addLecture(timetable: Timetable, lecture: UserLecture): Promise<void> {
  ObjectUtil.deleteObjectId(lecture);

  if (lecture.credit && (typeof lecture.credit === 'string' || <any>lecture.credit instanceof String)) {
    lecture.credit = Number(lecture.credit);
  }

  for (var i = 0; i< timetable.lecture_list.length; i++){
    if (UserLectureService.isIdenticalCourseLecture(lecture, timetable.lecture_list[i])) {
      throw new DuplicateLectureError();
    }
  }

  validateLectureTime(timetable, lecture);

  UserLectureService.validateLectureColor(lecture)

  let creationDate = new Date();
  lecture.created_at = creationDate;
  lecture.updated_at = creationDate;
  await TimetableRepository.insertUserLecture(timetable._id, lecture);
  await TimetableRepository.updateUpdatedAt(timetable._id, Date.now());
}


export async function addCustomLecture(timetable: Timetable, lecture: UserLecture): Promise<void> {
  /* If no time json is found, mask is invalid */
  LectureService.setTimemask(lecture);
  if (!lecture.course_title) throw new InvalidLectureUpdateRequestError(lecture);
  
  if (!UserLectureService.isCustomLecture(lecture)) throw new NotCustomLectureError(lecture);

  if (!lecture.color && !lecture.colorIndex) {
    lecture.colorIndex = getAvailableColorIndex(timetable);
  }

  await addLecture(timetable, lecture);
}

export function remove(userId, tableId): Promise<void> {
  return TimetableRepository.deleteByUserIdAndMongooseId(userId, tableId);
}

export async function getByTitle(userId: string, year: number, semester: number, title: string): Promise<Timetable> {
  return TimetableRepository.findByUserIdAndSemesterAndTitle(userId, year, semester, title);
}

export async function getByMongooseId(userId, tableId: string): Promise<Timetable> {
  return TimetableRepository.findByUserIdAndMongooseId(userId, tableId);
}

export async function getHavingLecture(year: number, semester: number, courseNumber: string, lectureNumber: string): Promise<Timetable[]> {
  return TimetableRepository.findHavingLecture(year, semester, courseNumber, lectureNumber);
}

export async function modifyTitle(tableId, userId, newTitle): Promise<void> {
  let target = await TimetableRepository.findByUserIdAndMongooseId(userId, tableId);
  if (target.title === newTitle) {
    return;
  }

  let duplicate = await TimetableRepository.findByUserIdAndSemesterAndTitle(userId, target.year, target.semester, newTitle);
  if (duplicate !== null) {
    throw new DuplicateTimetableTitleError(userId, target.year, target.semester, newTitle);
  }

  await TimetableRepository.updateTitleByUserId(tableId, userId, newTitle);
  await TimetableRepository.updateUpdatedAt(tableId, Date.now());
}


export async function addFromParam(params): Promise<Timetable> {
  if (!params || !params.user_id || !params.year || !params.semester || !params.title) {
    throw new TimetableNotEnoughParamError(params);
  }

  let duplicate = await TimetableRepository.findByUserIdAndSemesterAndTitle(params.user_id, params.year, params.semester, params.title);
  if (duplicate !== null) {
    throw new DuplicateTimetableTitleError(params.user_id, params.year, params.semester, params.title);
  }

  let newTimetable: Timetable = {
    user_id : params.user_id,
    year : params.year,
    semester : params.semester,
    title : params.title,
    lecture_list : [],
    updated_at: Date.now()
  };

  return await TimetableRepository.insert(newTimetable);
};

export async function resetLecture(userId:string, tableId: string, lectureId: string): Promise<void> {
  let table: Timetable = await getByMongooseId(userId, tableId);
  let lecture: UserLecture = getUserLectureFromTimetableByLectureId(table, lectureId);
  if (UserLectureService.isCustomLecture(lecture)) {
    throw new CustomLectureResetError();
  }

  let refLecture = await RefLectureService.getByCourseNumber(table.year, table.semester, lecture.course_number, lecture.lecture_number);
  if (refLecture === null) {
    throw new RefLectrureNotFoundError();
  }

  let colorIndex = getAvailableColorIndex(table);
  let newLecture = UserLectureService.fromRefLecture(refLecture, colorIndex);
  newLecture._id = lectureId;

  await TimetableRepository.partialUpdateUserLecture(tableId, newLecture);
  await TimetableRepository.updateUpdatedAt(tableId, Date.now());
}

export async function partialModifyUserLecture(userId: string, tableId: string, lecture: any): Promise<void> {
  let table = await TimetableRepository.findByUserIdAndMongooseId(userId, tableId);

  if (!table) {
    throw new TimetableNotFoundError();
  }

  if (lecture.course_number || lecture.lecture_number) {
    logger.error("partialModifyUserLecture: Attempt to modify identity")
    throw new InvalidLectureUpdateRequestError(lecture);
  }

  if (lecture['class_time_json']) {
    LectureService.setTimemask(lecture);
    lecture['class_time_mask'] = TimePlaceUtil.timeJsonToMask(lecture['class_time_json'], true);
  }

  if (lecture['class_time_mask']) {
    validateLectureTime(table, lecture);
  }

  if (lecture['color']) {
    UserLectureService.validateLectureColor(lecture);
  }

  lecture.updated_at = Date.now();

  await TimetableRepository.partialUpdateUserLecture(table._id, lecture);
  await TimetableRepository.updateUpdatedAt(table._id, Date.now());
}

function validateLectureTime(table: Timetable, lecture: UserLecture): void {
  if (isOverlappingLecture(table, lecture)) {
    throw new LectureTimeOverlapError();
  }
}

function isOverlappingLecture(table: Timetable, lecture: UserLecture): boolean {
  let overlappingLectureIds = getOverlappingLectureIds(table, lecture);
  if (overlappingLectureIds.length == 0) {
    return false;
  } else if (overlappingLectureIds.length == 1 && overlappingLectureIds[0] == lecture._id) {
    return false;
  } else {
    return true;
  }
}

function getOverlappingLectureIds(table: Timetable, lecture: UserLecture): string[] {
  let lectureIds = [];
  for (var i=0; i<table.lecture_list.length; i++) {
    var tableLecture:any = table.lecture_list[i];
    for (var j=0; j<tableLecture.class_time_mask.length; j++) {
      if ((tableLecture.class_time_mask[j] & lecture.class_time_mask[j]) != 0) {
        lectureIds.push(tableLecture._id); 
      }
    }
  }
  return lectureIds;
}

function getAvailableColorIndices(table: Timetable): number[] {
  var checked:boolean[] = [];
  for (var i=0; i<table.lecture_list.length; i++) {
    var lecture_color = table.lecture_list[i].colorIndex;
    checked[lecture_color] = true;
  }

  var ret:number[] = [];
  // colorIndex = 0 is custom color!
  for (var i=1; i<Color.numColor; i++) {
    if (!checked[i]) ret.push(i);
  }
  return ret;
}

function getAvailableColorIndex(table: Timetable): number {
  let availableIndices = getAvailableColorIndices(table);
  if (availableIndices.length == 0) return Math.floor(Math.random() * Color.numColor) + 1;
  else return availableIndices[Math.floor(Math.random() * availableIndices.length)]
}

function getUserLectureFromTimetableByLectureId(table: Timetable, lectureId: string): UserLecture {
  for (let i=0; i<table.lecture_list.length; i++) {
    let lecture = table.lecture_list[i];
    if (lecture._id == lectureId) {
      return lecture;
    }
  }
  throw new UserLectureNotFoundError();
}

export async function removeLecture(userId: string, tableId: string, lectureId: string): Promise<void> {
  await TimetableRepository.deleteLectureWithUserId(userId, tableId, lectureId);
  await TimetableRepository.updateUpdatedAt(tableId, Date.now());
}

export function getUserLectureFromTimetableByCourseNumber(table: Timetable, courseNumber: string, lectureNumber:string): UserLecture {
  for (let i=0; i<table.lecture_list.length; i++) {
    let lecture = table.lecture_list[i];
    if (lecture.course_number === courseNumber && lecture.lecture_number === lectureNumber) {
      return lecture;
    }
  }
  return null;
}

export function getAbstractListByUserId(userId: string): Promise<AbstractTimetable[]> {
  return TimetableRepository.findAbstractListByUserId(userId);
}

export function getRecentByUserId(userId: string): Promise<Timetable> {
  return TimetableRepository.findRecentByUserId(userId);
}

export function getBySemester(userId: string, year: number, semester: number): Promise<Timetable[]> {
  return TimetableRepository.findBySemester(userId, year, semester);
}
