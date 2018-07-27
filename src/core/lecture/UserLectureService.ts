import RefLecture from './model/RefLecture';
import UserLecture from './model/UserLecture';
import Util = require('../util');
import libcolor = require('../color');
import InvalidLectureColorIndexError from './error/InvalidLectureColorIndexError';
import InvalidLectureColorError from './error/InvalidLectureColorError';

export function isCustomLecture(lecture: UserLecture): boolean {
    return !lecture.course_number && !lecture.lecture_number;
}
  
export function validateLectureColor(lecture: UserLecture): void {
    if (lecture.colorIndex > libcolor.numColor) throw new InvalidLectureColorIndexError(lecture.colorIndex);
    if (lecture.color) {
        if (lecture.color.fg && !Util.isColor(lecture.color.fg)) throw new InvalidLectureColorError(lecture.color);
        if (lecture.color.bg && !Util.isColor(lecture.color.bg)) throw new InvalidLectureColorError(lecture.color);
    }
}

export function isIdenticalCourseLecture(l1: UserLecture, l2: UserLecture): boolean {
    if (isCustomLecture(l1) || isCustomLecture(l2)) return false;
    return (l1.course_number === l2.course_number && l1.lecture_number === l2.lecture_number);
}

export function fromRefLecture(refLecture: RefLecture, colorIndex: number): UserLecture {
    let creationDate = new Date();
    return {
      classification: refLecture.classification,                           // 교과 구분
      department: refLecture.department,                               // 학부
      academic_year: refLecture.academic_year,                            // 학년
      course_title: refLecture.course_title,   // 과목명
      credit: refLecture.credit,                                   // 학점
      class_time: refLecture.class_time,
      class_time_json: refLecture.class_time_json,
      class_time_mask: refLecture.class_time_mask,
      instructor: refLecture.instructor,                               // 강사
      quota: refLecture.quota,                                    // 정원
      remark: refLecture.remark,                                   // 비고
      category: refLecture.category,
      course_number: refLecture.course_number,   // 교과목 번호
      lecture_number: refLecture.lecture_number,  // 강좌 번호
      created_at: creationDate,
      updated_at: creationDate,
      colorIndex: colorIndex
    }
}
  