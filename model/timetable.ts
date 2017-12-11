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
  isEqualLecture} from './lecture';
import Util = require('../lib/util');
import errcode = require('../lib/errcode');
import Color = require('../lib/color');
import * as log4js from 'log4js';
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

let mongooseModel = mongoose.model('Timetable', TimetableSchema);

export class TimetableModel {
  _id: string;
  userId: string;
  year: number;
  semester: number;
  title: string;
  lectureList: mongoose.Types.DocumentArray<any>;
  updatedAt: number;
  mongooseDocument: mongoose.Document;

  constructor(mongooseDocument:mongoose.Document) {
    if (mongooseDocument === null) {
      logger.error("TimetableModel: mongoose document is null");
      throw "mongoose document is null";
    }
    let wrapper = <any>mongooseDocument;
    this._id = wrapper._id;
    this.userId = wrapper.user_id;
    this.year = wrapper.year;
    this.semester = wrapper.semester;
    this.title = wrapper.title;
    this.lectureList = wrapper.lecture_list;
    this.updatedAt = wrapper.updated_at;

    this.mongooseDocument = mongooseDocument;
  }

  async copy(): Promise<TimetableModel> {
    for (let trial = 1; true; trial++) {
      let newTitle = this.title + " (" + trial + ")";
      try {
        return await this.copyWithTitle(newTitle);
      } catch (err) {
        if (err === errcode.DUPLICATE_TIMETABLE_TITLE) {
          continue;
        }
        throw err;
      }
    }
  }

  async copyWithTitle(newTitle:string): Promise<TimetableModel> {
    if (newTitle == this.title) throw errcode.DUPLICATE_TIMETABLE_TITLE;
    let duplicatePromise = TimetableModel.getByTitleRaw(this.userId, this.year, this.semester, newTitle);
    let copied = JSON.parse(JSON.stringify(this.mongooseDocument));
    Util.deleteObjectId(copied);
    let newMongooseDocument:any = new mongooseModel(copied);
    newMongooseDocument.title = newTitle;
    if (await duplicatePromise) throw errcode.DUPLICATE_TIMETABLE_TITLE;
    await newMongooseDocument.save();
    return new TimetableModel(newMongooseDocument);
  }

  async addRefLecture(lectureId: string): Promise<void> {
    let refLecture:any = await findRefLectureWithMongooseId(lectureId);
    if (!refLecture) throw errcode.REF_LECTURE_NOT_FOUND;
    if (refLecture["year"] != this.year || refLecture["semester"] != this.semester) {
      throw errcode.WRONG_SEMESTER;
    }

    refLecture.colorIndex = this.getAnyAvailableColor();
    await this.addLecture(refLecture);
  }

  async addCustomLecture(rawLecture: any): Promise<void> {
    /* If no time json is found, mask is invalid */
    setLectureTimemask(rawLecture);
    if (!rawLecture.course_title) throw errcode.NO_LECTURE_TITLE;
    
    if (rawLecture.course_number || rawLecture.lecture_number) throw errcode.NOT_CUSTOM_LECTURE;

    if (rawLecture["year"] && rawLecture["semester"] && (rawLecture["year"] != this.year || rawLecture["semester"] != this.semester))
      throw errcode.WRONG_SEMESTER;

    if (!rawLecture.color && !rawLecture.colorIndex) rawLecture.colorIndex = this.getAnyAvailableColor();

    await this.addLecture(rawLecture);
  }

  private async addLecture(rawLecture: any): Promise<void> {
    /*
     * Sanitize json using object_del_id.
     * If you don't do it,
     * the existing lecture gets overwritten
     * which is potential security breach.
     */
    Util.deleteObjectId(rawLecture);

    if (rawLecture.credit && (typeof rawLecture.credit === 'string' || rawLecture.credit instanceof String)) {
      rawLecture.credit = Number(rawLecture.credit);
    }

    let lecture = newUserLecture(rawLecture);

    for (var i = 0; i<this.lectureList.length; i++){
      if (isEqualLecture(lecture, this.lectureList[i])) {
        throw errcode.DUPLICATE_LECTURE;
      }
    }
    if (!this.validateLectureTime(lecture._id, lecture)) {
      throw errcode.LECTURE_TIME_OVERLAP;
    }
  
    if (!validateLectureColor(lecture)) {
      throw errcode.INVALID_COLOR;
    }
  
    lecture.created_at = new Date();
    lecture.updated_at = new Date();
    this.lectureList.push(lecture); // shallow copy of this.mongooseDocuemnt.lecture_list
    await this.mongooseDocument.save();
  }

  getLecture(lectureId): UserLectureDocument {
    return this.lectureList.id(lectureId);
  }

  private rawLectureToUpdateSet(lectureId, rawLecture): any {
    if (rawLecture.course_number || rawLecture.lecture_number) {
      throw errcode.ATTEMPT_TO_MODIFY_IDENTITY;
    }
  
    if (rawLecture['class_time_json']) {
      rawLecture['class_time_mask'] = Util.timeJsonToMask(rawLecture['class_time_json'], true);
    }
  
    if (rawLecture['class_time_mask'] && !this.validateLectureTime(lectureId, rawLecture)) {
      throw errcode.LECTURE_TIME_OVERLAP;
    }
  
    if (rawLecture['color'] && !validateLectureColor(rawLecture)) {
      throw errcode.INVALID_COLOR;
    }
  
    rawLecture.updated_at = Date.now();
  
    var update_set = {};
    Util.deleteObjectId(rawLecture);
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
    
    if (newMongooseDocument === null) throw errcode.TIMETABLE_NOT_FOUND;
    if (!newMongooseDocument.lecture_list.id(lectureId)) throw errcode.LECTURE_NOT_FOUND;
    this.mongooseDocument = newMongooseDocument;
    this.lectureList = this.mongooseDocument['lecture_list'];
  };


  async resetLecture(lectureId: string): Promise<void> {
    var lecture:UserLectureDocument = this.getLecture(lectureId);
    if (isCustomLecture(lecture)) {
      throw errcode.IS_CUSTOM_LECTURE;
    }

    let refLecture: any = await findRefLectureWithCourseNumber
        (this.year, this.semester, lecture.course_number, lecture.lecture_number);

    if (refLecture === null) throw errcode.REF_LECTURE_NOT_FOUND;

    delete refLecture.lecture_number;
    delete refLecture.course_number;
    await this.updateLecture(lectureId, refLecture);
  }

  static async deleteLectureWithUser(userId: string, tableId: string, lectureId: string): Promise<TimetableModel> {
    let document = await mongooseModel.findOneAndUpdate(
      {'_id' : tableId, 'user_id' : userId},
      { $pull: {lecture_list : {_id: lectureId} } }, {new: true})
      .exec();
    if (!document) throw errcode.TIMETABLE_NOT_FOUND;
    return new TimetableModel(document);
  }

  static async deleteLecture(tableId: string, lectureId: string): Promise<TimetableModel> {
    let document = await mongooseModel.findOneAndUpdate(
      {'_id' : tableId},
      { $pull: {lecture_list : {_id: lectureId} } }, {new: true})
      .exec();
    if (!document) throw errcode.TIMETABLE_NOT_FOUND;
    return new TimetableModel(document);
  }

  async deleteLecture(lectureId): Promise<void> {
    let newMongooseDocument = await mongooseModel.findOneAndUpdate(
      {'_id' : this._id},
      { $pull: {lecture_list : {_id: lectureId} } }, {new: true})
      .exec();
    this.mongooseDocument = newMongooseDocument;
    this.lectureList = this.mongooseDocument['lecture_list'];
  };


  validateLectureTime(lectureId:string, lecture:UserLectureDocument): boolean {
    for (var i=0; i<this.lectureList.length; i++) {
      var tableLecture:LectureDocument = this.lectureList[i];
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

  static async remove(userId, tableId): Promise<void> {
    let document = await mongooseModel.findOneAndRemove({'user_id': userId, '_id' : tableId}).lean().exec();
    if (!document) throw errcode.TIMETABLE_NOT_FOUND;
  }

  static async changeTitle(userId, tableId, newTitle): Promise<void> {
    let document = await mongooseModel.findOne({'user_id': userId, '_id' : tableId}).exec();
    if (!document) throw errcode.TIMETABLE_NOT_FOUND;
    if (document['title'] == newTitle) return;

    let duplicate = await TimetableModel.getByTitleRaw(userId, document['year'], document['semester'], newTitle);
    if (duplicate !== null) throw errcode.DUPLICATE_TIMETABLE_TITLE;
    
    document['title'] = newTitle;
    await document.save();
  }

  static async createFromParam(params): Promise<TimetableModel> {
    if (!params || !params.user_id || !params.year || !params.semester || !params.title) {
      throw errcode.NOT_ENOUGH_TO_CREATE_TIMETABLE;
    }

    let duplicatePromise = TimetableModel.getByTitleRaw(params.user_id, params.year, params.semester, params.title);

    let mongooseDocument = new mongooseModel({
      user_id : params.user_id,
      year : params.year,
      semester : params.semester,
      title : params.title,
      lecture_list : []
    });

    if (await duplicatePromise !== null) throw errcode.DUPLICATE_TIMETABLE_TITLE;
    await mongooseDocument.save();
    return new TimetableModel(mongooseDocument);
  };

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

  static async getByTitle(userId: string, year: number, semester: number, title: string): Promise<TimetableModel> {
    let result = await TimetableModel.getByTitleRaw(userId, year, semester, title);

    if (result === null) return null;
    return new TimetableModel(result);
  }

  static getByTableIdRaw(userId: string, tableId: string): Promise<mongoose.Document> {
    var query:any = mongooseModel.findOne({'user_id': userId, '_id' : tableId});
    return query.exec();
  }

  static async getByTableId(userId: string, tableId: string): Promise<TimetableModel> {
    let mongooseDocument = await TimetableModel.getByTableIdRaw(userId, tableId);
    if (mongooseDocument === null) return null;
    return new TimetableModel(mongooseDocument);
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

  static async getWithLecture(year: number, semester: number, courseNumber: string, lectureNumber: string): Promise<TimetableModel[]> {
    let mongooseDocuments = await TimetableModel.getWithLectureRaw(year, semester, courseNumber, lectureNumber);
    if (mongooseDocuments === null) return null;
    if (mongooseDocuments.length == 0) return [];
    let ret: TimetableModel[] = [];
    for (let i=0; i<mongooseDocuments.length; i++) {
      ret.push(new TimetableModel(mongooseDocuments[i]));
    }
    return ret;
  }

  static getRecentRaw(user_id): Promise<any> {
    var query:any = mongooseModel.findOne({'user_id': user_id}).sort({updated_at : -1});
    return query.exec();
  };
}
