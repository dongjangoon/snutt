import Timetable from "./model/Timetable";
import DuplicateTimetableTitleError from "./error/DuplicateTimetableTitleError";
import ObjectUtil = require('@app/core/common/util/ObjectUtil');
import TimetableRepository = require('./TimetableRepository');

import AbstractTimetable from './model/AbstractTimetable';
import TimetableNotEnoughParamError from './error/TimetableNotEnoughParamError';

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

export function getAbstractListByUserId(userId: string): Promise<AbstractTimetable[]> {
  return TimetableRepository.findAbstractListByUserId(userId);
}

export function getRecentByUserId(userId: string): Promise<Timetable> {
  return TimetableRepository.findRecentByUserId(userId);
}

export function getBySemester(userId: string, year: number, semester: number): Promise<Timetable[]> {
  return TimetableRepository.findBySemester(userId, year, semester);
}
