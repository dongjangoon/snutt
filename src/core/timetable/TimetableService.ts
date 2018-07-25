import Timetable from "./model/Timetable";
import DuplicateTimetableTitleError from "./error/DuplicateTimetableTitleError";
import ObjectUtil = require('@app/core/common/util/ObjectUtil');
import TimetableRepository = require('./TimetableRepository');

import Util = require('../util');
import errcode = require('@app/api/errcode');
import Color = require('../color');
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import LectureService = require('@app/core/lecture/LectureService');
import RefLectureService = require('@app/core/lecture/RefLectureService');
import UserLectureService = require('@app/core/lecture/UserLectureService');
import UserLecture from '@app/core/lecture/model/UserLecture';
import RefLecture from '@app/core/lecture/model/RefLecture';
import RefLectrureNotFoundError from "../lecture/error/RefLectureNotFoundError";
import WrongRefLectureSemesterError from "./error/WrongRefLectureSemesterError";
import DuplicateLectureError from "./error/DuplicateLectureError";
import TimetableNotFoundError from "./error/TimetableNotFoundError";
import UserLectureNotFoundError from "./error/UserLectureNotFoundError";

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
        throw new DuplicateTimetableTitleError(src.userId, src.year, src.semester, newTitle);
    }
    if (await TimetableRepository.getByTitle(src.userId, src.year, src.semester, newTitle)) {
        throw new DuplicateTimetableTitleError(src.userId, src.year, src.semester, newTitle);
    }
    
    let copied = ObjectUtil.deepCopy(src);
    ObjectUtil.deleteObjectId(copied);
    copied.title = newTitle;
    await TimetableRepository.add(copied);
}

export async function addRefLecture(timetable: Timetable, lectureId: string): Promise<void> {
  let lecture = await RefLectureService.getByMongooseId(lectureId);
  if (!lecture) throw new RefLectrureNotFoundError(lectureId);
  if (lecture.year != timetable.year || lecture.semester != timetable.semester) {
    throw new WrongRefLectureSemesterError(lecture.year, lecture.semester);
  }
  let userLecture = UserLectureService.fromRefLecture(lecture, getAnyAvailableColor(timetable));
  await addLecture(timetable, userLecture);
}

export async function addLecture(timetable: Timetable, lecture: UserLecture): Promise<void> {
  ObjectUtil.deleteObjectId(lecture);

  if (lecture.credit && (typeof lecture.credit === 'string' || <any>lecture.credit instanceof String)) {
    lecture.credit = Number(lecture.credit);
  }

  for (var i = 0; i< timetable.lectureList.length; i++){
    if (UserLectureService.isIdenticalCourseLecture(lecture, timetable.lectureList[i])) {
      throw new DuplicateLectureError();
    }
  }

  validateLectureTime(timetable, lecture);

  UserLectureService.validateLectureColor(lecture)

  let creationDate = new Date();
  lecture.created_at = creationDate;
  lecture.updated_at = creationDate;
  timetable.lectureList.push(lecture); // shallow copy of this.mongooseDocuemnt.lecture_list
  await timetable.save();
}


export async function addCustomLecture(timetable: Timetable, lecture: UserLecture): Promise<void> {
  /* If no time json is found, mask is invalid */
  LectureService.setTimemask(lecture);
  if (!lecture.course_title) throw errcode.NO_LECTURE_TITLE;
  
  if (!UserLectureService.isCustomLecture(lecture)) throw errcode.NOT_CUSTOM_LECTURE;

  if (!lecture.color && !lecture.colorIndex) lecture.colorIndex = getAnyAvailableColor(timetable);

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
}


export async function addFromParam(params): Promise<Timetable> {
  if (!params || !params.user_id || !params.year || !params.semester || !params.title) {
    throw errcode.NOT_ENOUGH_TO_CREATE_TIMETABLE;
  }

  let duplicate = await TimetableRepository.findByUserIdAndSemesterAndTitle(params.user_id, params.year, params.semester, params.title);
  if (duplicate !== null) {
    throw new DuplicateTimetableTitleError(params.user_id, params.year, params.semester, params.title);
  }

  let newTimetable: Timetable = {
    userId : params.user_id,
    year : params.year,
    semester : params.semester,
    title : params.title,
    lectureList : [],
    updatedAt: Date.now()
  };

  return await TimetableRepository.insert(newTimetable);
};

export async function resetLecture(userId:string, tableId: string, lectureId: string): Promise<void> {
  let table: Timetable = await getByMongooseId(userId, tableId);
  let lecture: UserLecture = getUserLecture(table, lectureId);
  if (UserLectureService.isCustomLecture(lecture)) {
    throw new CustomLectureError(lecture);
  }

  let refLecture = await RefLectureService.getByCourseNumber(table.year, table.semester, lecture.course_number, lecture.lecture_number);
  if (refLecture === null) {
    throw new RefLectrureNotFoundError();
  }

  let newLecture = UserLectureService.fromRefLecture(refLecture, getAnyAvailableColor());
  newLecture._id = lectureId;

  await TimetableRepository.updateUserLecture(tableId, newLecture);
}

export class TimetableModel {
    private rawLectureToUpdateSet(lectureId, rawLecture): any {
      if (rawLecture.course_number || rawLecture.lecture_number) {
        throw errcode.ATTEMPT_TO_MODIFY_IDENTITY;
      }
    
      if (rawLecture['class_time_json']) {
        rawLecture['class_time_mask'] = TimePlaceUtil.timeJsonToMask(rawLecture['class_time_json'], true);
      }
    
      if (rawLecture['class_time_mask'] && !this.validateLectureTime(lectureId, rawLecture)) {
        throw errcode.LECTURE_TIME_OVERLAP;
      }
    
      if (rawLecture['color'] && !validateLectureColor(rawLecture)) {
        throw errcode.INVALID_COLOR;
      }
    
      rawLecture.updated_at = Date.now();
    
      var update_set = {};
      ObjectUtil.deleteObjectId(rawLecture);
      for (var field in rawLecture) {
        update_set['lecture_list.$.' + field] = rawLecture[field];
      }
      return update_set;
    }
  
    async updateLecture(lectureId: string, rawLecture: any): Promise<void> {
      if (!lectureId || lectureId == "undefined") {
        throw "lectureId cannot be null nor undefined";
      }
      let updateSet = this.rawLectureToUpdateSet(lectureId, rawLecture);
      let newMongooseDocument: any = await mongooseModel.findOneAndUpdate({ "_id" : this._id, "lecture_list._id" : lectureId},
        {$set : updateSet}, {new: true}).exec();
      
      if (newMongooseDocument === null) {
        throw new TimetableNotFoundError();
      }

      if (!newMongooseDocument.lecture_list.id(lectureId)) {
        throw new UserLectureNotFoundError();
      }
    };
  
  
    validateLectureTime(lectureId:string, lecture:UserLectureDocument): boolean {
      for (var i=0; i<this.lectureList.length; i++) {
        var tableLecture:any = this.lectureList[i];
        if (lectureId == tableLecture._id) continue;
        for (var j=0; j<tableLecture.class_time_mask.length; j++)
          if ((tableLecture.class_time_mask[j] & lecture.class_time_mask[j]) != 0) return false;
      }
      return true;
    }
  
    getAvailableColors(): number[] {
      var checked:boolean[] = [];
      for (var i=0; i<this.lectureList.length; i++) {
        var lecture_color = this.lectureList[i].colorIndex;
        checked[lecture_color] = true;
      }
    
      var ret:number[] = [];
      // colorIndex = 0 is custom color!
      for (var i=1; i<Color.numColor; i++) {
        if (!checked[i]) ret.push(i);
      }
      return ret;
    }
  
    getAnyAvailableColor(): number {
      let availableColors = this.getAvailableColors();
      // colorIndex = 0 is custom color!
      if (availableColors.length == 0) return Math.floor(Math.random() * Color.numColor) + 1;
      else return availableColors[Math.floor(Math.random() * availableColors.length)]
    }
  
    findLectureId(courseNumber, lectureNumber): string {
      for (let i=0; i<this.lectureList.length; i++) {
        if (this.lectureList[i]['course_number'] == courseNumber &&
            this.lectureList[i]['lecture_number'] == lectureNumber) return this.lectureList[i]['_id'];
      }
      throw errcode.LECTURE_NOT_FOUND;
    }
  }
  