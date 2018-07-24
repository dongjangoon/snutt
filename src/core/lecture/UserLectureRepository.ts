/*
 * model/lecture.js
 * Lecture는 수강편람 상의 강의
 * UserLecture는 유저 시간표 상의 강의
 */
import mongoose = require('mongoose');

let userLectureSchema = new mongoose.Schema({
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
    category: String,
    course_number: String,
    lecture_number: String,
    created_at: Date,
    updated_at: Date,
    color: {fg : String, bg : String},
    colorIndex: { type: Number, required: true, default: 0 }
});

let mongooseModel = mongoose.model('UserLecture', userLectureSchema, 'userlectures');

export function getSchema() {
  return userLectureSchema;
}
