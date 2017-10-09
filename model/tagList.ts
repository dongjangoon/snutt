/**
 * Created by north on 16. 2. 24.
 */
import mongoose = require('mongoose');
import errcode = require('../lib/errcode');

var TagListSchema = new mongoose.Schema({
  year: {type: Number, required: true},
  semester: {type: Number, required: true},
  updated_at: {type: Number, default: Date.now()},
  tags: {
    classification: {type: [String]},
    department: {type: [String]},
    academic_year: {type: [String]},
    credit: {type: [String]},
    instructor: {type: [String]},
    category: {type: [String]}
    }
});

TagListSchema.index({year: 1, semester: 1});

let mongooseModel = mongoose.model('TagList', TagListSchema);

export class TagList {
  year: number;
  semester: number;
  updated_at: number;
  tags: {
    classification: string[],
    department: string[],
    academic_year: string[],
    credit: string[],
    instructor: string[],
    category: string[]
  };

  private static fromMongooseDocument(doc: mongoose.Document): TagList {
    if (doc === null) return null;
    let tagList = new TagList();
    tagList.year = doc['year'];
    tagList.semester = doc['semester'];
    tagList.updated_at = doc['updated_at'];
    tagList.tags = doc['tags'];
    return tagList;
  }

  static async findBySemester(year: number, semester: number): Promise<TagList> {
    let mongooseDocument = await mongooseModel.findOne({'year' : year, 'semester' : semester}).exec();
    return TagList.fromMongooseDocument(mongooseDocument);
  }

  static async getUpdateTime(year: number, semester: number): Promise<number> {
    let mongooseDocument = await mongooseModel.findOne({'year' : year, 'semester' : semester},'updated_at').exec();
    if (!mongooseDocument) throw errcode.TAG_NOT_FOUND;
    let updateDate: number = mongooseDocument['updated_at'];
    return updateDate;
  }

  static async createOrUpdateTags(year: number, semester: number, tags: {
    classification: string[],
    department: string[],
    academic_year: string[],
    credit: string[],
    instructor: string[],
    category: string[]
  }): Promise<void> {
    await mongooseModel.findOneAndUpdate(
      {'year': year, 'semester': semester}, 
      {'tags': tags, 'updated_at': Date.now()}, 
      {upsert: true})
      .exec();
  }
}
