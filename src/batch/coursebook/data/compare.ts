import RefLecture from '@app/core/lecture/model/RefLecture';
import RefLectureService = require('@app/core/lecture/RefLectureService');
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import winston = require('winston');
var logger = winston.loggers.get('default');

export type LectureIdent = {
  course_number: string,
  lecture_number: string,
  course_title: string
}

export type LectureIdentUpdated = {
  course_number: string,
  lecture_number: string,
  course_title: string,
  before: any,
  after: any
}

export class LectureDiff {
  created: LectureIdent[];
  removed: LectureIdent[];
  updated: LectureIdentUpdated[];

  constructor() {
    this.created = [];
    this.removed = [];
    this.updated = [];
  }

  addLecture(array:LectureIdent[], lecture:RefLecture) {
    array.push({
      course_number: lecture.course_number,
      lecture_number: lecture.lecture_number,
      course_title: lecture.course_title
    });
  };

  addCreated(lecture:RefLecture) { this.addLecture(this.created, lecture) };
  addRemoved(lecture:RefLecture) { this.addLecture(this.removed, lecture) };
  addUpdated(updatedObj:any, lecture:RefLecture) {
    updatedObj.course_number = lecture.course_number;
    updatedObj.lecture_number = lecture.lecture_number;
    updatedObj.course_title = lecture.course_title;
    this.updated.push(updatedObj);
  };
}

function compareLecture(oldl, newl) {
  var updated = {
    before:{},
    after:{}
  };
  var keys = [
    'classification',
    'department',
    'academic_year',
    'course_title',
    'credit',
    'instructor',
    'quota',
    //'enrollment',
    'remark',
    'category'
    ];
  for (var i=0; i<keys.length; i++) {
    if (oldl[keys[i]] != newl[keys[i]]) {
      updated.before[keys[i]] = oldl[keys[i]];
      updated.after[keys[i]] = newl[keys[i]];
    }
  }

  if (!TimePlaceUtil.equalTimeJson(oldl.class_time_json, newl.class_time_json)) {
    updated.before["class_time_json"] = oldl.class_time_json;
    updated.after["class_time_json"] = newl.class_time_json;
  }

  if (Object.keys(updated.after).length === 0) updated = null;
  return updated;
};

export async function compareLectures(year:number, semester: number, new_lectures:RefLecture[]): Promise<LectureDiff> {
  logger.info("Pulling existing lectures...");
  var old_lectures = await RefLectureService.getBySemester(year, semester);
  var diff = new LectureDiff();
  var checked:boolean[] = [];
  for (let i=0; i<new_lectures.length; i++) {
    var exists = false;
    for (let j=0; j<old_lectures.length; j++) {
      if (checked[j]) continue;
      if (old_lectures[j].course_number != new_lectures[i].course_number) continue;
      if (old_lectures[j].lecture_number != new_lectures[i].lecture_number) continue;
      var diff_update = compareLecture(old_lectures[j], new_lectures[i]);
      if (diff_update) diff.addUpdated(diff_update, old_lectures[j]);
      checked[j] = true;
      exists = true;
      break;
    }
    if (exists === false) {
      diff.addCreated(new_lectures[i]);
      //console.log(new_lectures[i].course_title+" created");
    }
  }
  for (let i=0; i<old_lectures.length; i++) {
    if (!checked[i]) {
      diff.addRemoved(old_lectures[i]);
      //console.log(old_lectures[i].course_title+" removed");
    }
  }

  return diff;
}
