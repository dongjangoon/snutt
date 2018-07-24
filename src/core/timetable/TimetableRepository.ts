import mongoose = require('mongoose');
import * as log4js from 'log4js';
import Timetable from './model/Timetable';

import UserLectureRepository = require('@app/core/lecture/UserLectureRepository');
var logger = log4js.getLogger();

let TimetableSchema = new mongoose.Schema({
  user_id : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  year : {type : Number, required : true },
  semester : {type : Number, required : true, min:1, max:4 },
  title : {type : String, required : true },
  lecture_list: [UserLectureRepository.getSchema()],
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



  
static getAbstractList(userId: string): Promise<
[{year: number,
  semester: number,
  title: string,
  _id: string,
  updated_at: Date }]> {
let query:any = mongooseModel.where('user_id', userId).select('year semester title _id updated_at').lean();
return query.exec();
}

static getBySemesterRaw(user_id, year, semester): Promise<[any]> {
var query:any = mongooseModel.find({'user_id': user_id, 'year': year, 'semester': semester});
return query.exec();
};

static getByTitleRaw(userId: string, year: number, semester: number, title: string): Promise<mongoose.Document> {
return mongooseModel.findOne({
user_id : userId,
year : year,
semester: semester,
title: title
}).exec();
}

static getByTableIdRaw(userId: string, tableId: string): Promise<mongoose.Document> {
var query:any = mongooseModel.findOne({'user_id': userId, '_id' : tableId});
return query.exec();
}

static getWithLectureRaw(year: number, semester: number, courseNumber: string, lectureNumber: string): Promise<mongoose.Document[]> {
return mongooseModel.find(
  {
    year: year,
    semester: semester,
    lecture_list: {
      $elemMatch : {
        course_number: courseNumber,
        lecture_number: lectureNumber
      }
    }
  }).exec();
}

static getRecentRaw(user_id): Promise<any> {
var query:any = mongooseModel.findOne({'user_id': user_id}).sort({updated_at : -1});
return query.exec();
};

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
