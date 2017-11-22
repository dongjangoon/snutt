/*
 * model/lecture.js
 * Lecture는 수강편람 상의 강의
 * UserLecture는 유저 시간표 상의 강의
 */
import mongoose = require('mongoose');
import errcode = require('../lib/errcode');
import Util = require('../lib/util');
import libcolor = require('../lib/color');

interface BaseLectureDocument {
  classification: string,                           // 교과 구분
  department: string,                               // 학부
  academic_year: string,                            // 학년
  course_title: string,   // 과목명
  credit: number,                                   // 학점
  class_time: string,
  class_time_json: [
    { day : number, start: number, len: number, place : string }
  ],
  class_time_mask: number[],
  instructor: string,                               // 강사
  quota: number,                                    // 정원
  enrollment: number,                               // 신청인원
  remark: string,                                   // 비고
  category: string
}

export interface LectureDocument extends BaseLectureDocument {
  year: number,           // 연도
  semester: number,       // 학기
  course_number: string,   // 교과목 번호
  lecture_number: string,  // 강좌 번호
}

export interface UserLectureDocument extends BaseLectureDocument {
  course_number: string,
  lecture_number: string,
  created_at: Date,
  updated_at: Date,
  color: {fg : string, bg : string},
  colorIndex: number
}

function BaseSchema(add){
  var schema = new mongoose.Schema({
    classification: String,                           // 교과 구분
    department: String,                               // 학부
    academic_year: String,                            // 학년
    course_title: { type: String, required: true },   // 과목명
    credit: Number,                                   // 학점
    class_time: String,
    class_time_json: [
      { day : Number, start: Number, len: Number, place : String }
    ],
    class_time_mask: { type: [ Number ], required: true, default: [0,0,0,0,0,0,0] },
    instructor: String,                               // 강사
    quota: Number,                                    // 정원
    enrollment: Number,                               // 신청인원
    remark: String,                                   // 비고
    category: String
  });

  if (add) {
    schema.add(add);
  }

  return schema;
}

export function isCustomLecture(lecture): boolean {
  return !lecture.course_number && !lecture.lecture_number;
}

export function isEqualLecture(l1, l2): boolean {
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

export function validateLectureColor(lecture: UserLectureDocument): boolean {
  if (lecture.colorIndex > libcolor.numColor) return false;
  if (lecture.color) {
    if (lecture.color.fg && !Util.isColor(lecture.color.fg)) return false;
    if (lecture.color.bg && !Util.isColor(lecture.color.bg)) return false;
  }
  return true;
}

export function setLectureTimemask(lecture: BaseLectureDocument): void {
  if (lecture.class_time_json) {
    if (!lecture.class_time_mask) {
      lecture.class_time_mask = Util.timeJsonToMask(lecture.class_time_json, true);
    } else {
      var timemask = Util.timeJsonToMask(lecture.class_time_json);
      for (var i=0; i<timemask.length; i++) {
        if (timemask[i] != lecture.class_time_mask[i])
          throw errcode.INVALID_TIMEMASK;
      }
    }
  } else if (lecture.class_time_mask) {
    throw errcode.INVALID_TIMEMASK;
  }
}

let refLectureSchema = BaseSchema({
  year: { type: Number, required: true },           // 연도
  semester: { type: Number, required: true },       // 학기
  course_number: { type: String, required: true},   // 교과목 번호
  lecture_number: { type: String, required: true},  // 강좌 번호
});

refLectureSchema.index({ year: 1, semester: 1});
refLectureSchema.index({ course_number: 1, lecture_number: 1 })

export let userLectureSchema = BaseSchema({
  course_number: String,
  lecture_number: String,
  created_at: Date,
  updated_at: Date,
  color: {fg : String, bg : String},
  colorIndex: { type: Number, required: true, default: 0 }
});

let LectureModel = mongoose.model('Lecture', refLectureSchema);

let UserLectureModel = mongoose.model('UserLecture', userLectureSchema);

export function newRefLecture(lecture) {
  return new LectureModel(lecture);
}

export function newUserLecture(lecture) {
  return new UserLectureModel(lecture);
}

/*
 * Mongoose 객체를 바로 open하지 않고 매개 함수를 이용,
 * 디비와 비즈니스 로직을 분리
 */

export function queryRefLecture(query, limit, offset): Promise<LectureDocument[]> {
  return <any>LectureModel.find(query).sort('course_title').lean()
    .skip(offset)
    .limit(limit)
    .exec();
}

export function findRefLectureWithCourseNumber
    (year: number, semester: number, courseNumber: string, lectureNumber: string): Promise<LectureDocument> {
  return <any>LectureModel.findOne({'year': year, 'semester': semester,
    'course_number': courseNumber, 'lecture_number': lectureNumber}).lean()
    .exec();
}

export function findRefLectureWithMongooseId(id: any): Promise<LectureDocument> {
  return <any>LectureModel.findOne({'_id': id}).lean().exec();
}

export function findRefLectureWithSemester(year: number, semester: number): Promise<LectureDocument[]> {
  return <any>LectureModel.find({year : year, semester : semester}).lean().exec();
}

export function deleteAllSemester(year: number, semester: number): Promise<any> {
  return LectureModel.remove({ year: year, semester: semester}).exec();
}

export function insertManyRefLecture(lectures): Promise<any[]> {
  return <any>LectureModel.insertMany(lectures);
}
