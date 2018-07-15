import errcode = require('@app/api/errcode');
import RefLecture from './model/RefLecture';
import UserLecture from './model/UserLecture';
import Util = require('../util');
import libcolor = require('../color');

export function isCustomLecture(lecture: UserLecture): boolean {
    return !lecture.course_number && !lecture.lecture_number;
}
/*
export function isEqual(l1: RefLecture, l2: RefLecture): boolean {
    if (isCustomLecture(l1)) return false;
    var ret = true;
    if (l1.year && l2.year)
      ret = ret && (l1.year == l2.year);
    if (l1.semester && l2.semester)
      ret = ret && (l1.semester  == l2.semester);
    return (ret &&
    l1.course_number == l2.course_number &&
    l1.lecture_number == l2.lecture_number);
}
*/
  
  export function validateLectureColor(lecture: UserLecture): boolean {
    if (lecture.colorIndex > libcolor.numColor) return false;
    if (lecture.color) {
      if (lecture.color.fg && !Util.isColor(lecture.color.fg)) return false;
      if (lecture.color.bg && !Util.isColor(lecture.color.bg)) return false;
    }
    return true;
  }
  