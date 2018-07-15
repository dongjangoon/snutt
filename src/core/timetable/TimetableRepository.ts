import mongoose = require('mongoose');
import {UserLectureDocument,
  userLectureSchema,
  LectureDocument,
  setLectureTimemask,
  newUserLecture,
  validateLectureColor,
  isCustomLecture,
  findRefLectureWithCourseNumber,
  findRefLectureWithMongooseId,
  isEqualLecture} from '@app/core/model/lecture';
import * as log4js from 'log4js';
import Timetable from './model/Timetable';
var logger = log4js.getLogger();

let TimetableSchema = new mongoose.Schema({
  user_id : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  year : {type : Number, required : true },
  semester : {type : Number, required : true, min:1, max:4 },
  title : {type : String, required : true },
  lecture_list: [userLectureSchema],
  updated_at : Date
});

TimetableSchema.index({ user_id: 1 })

TimetableSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

let mongooseModel = mongoose.model('Timetable', TimetableSchema, 'timetables');

export async function getByTitle(userId: string, year: number, semester: number, title: string): Promise<Timetable> {

}

function fromMongoose(mongooseDoc): Timetable {
  return {
    _id: mongooseDoc._id,
    userId: mongooseDoc.user_id,
    year: mongooseDoc.year,
    semester: mongooseDoc.semester,
    title: mongooseDoc.title,
    lectureList: mongooseDoc.lecture_list,
    updatedAt: mongooseDoc.updated_at
  }
}
