/**
 * Created by north on 16. 2. 24.
 */
import mongoose = require('mongoose');
import TagListNotFoundError from './error/TagListNotFoundError';
import TagList from './model/TagList';

var TagListSchema = new mongoose.Schema({
  year: {type: Number, required: true},
  semester: {type: Number, required: true},
  updated_at: mongoose.Schema.Types.Mixed, // Issue #92. After all data converted to nubmer, modify this to Number
  tags: {
    classification: {type: [String]},
    department: {type: [String]},
    academic_year: {type: [String]},
    credit: {type: [String]},
    instructor: {type: [String]},
    category: {type: [String]},
    etc: {type: [String]},
  }
});

TagListSchema.index({year: 1, semester: 1});

let mongooseModel = mongoose.model('TagList', TagListSchema, 'taglists');

export async function findBySemester(year: number, semester: number): Promise<TagList> {
  let mongooseDocument = await mongooseModel.findOne({'year' : year, 'semester' : semester}).exec();
  return fromMongooseDocument(mongooseDocument);
}

export async function findUpdateTimeBySemester(year: number, semester: number): Promise<number> {
  let mongooseDocument = await mongooseModel.findOne({'year' : year, 'semester' : semester},'updated_at').exec();
  if (!mongooseDocument) throw new TagListNotFoundError();
  return getUpdateTimeFromMongooseDocument(mongooseDocument);
}

export async function upsert(tagList: TagList): Promise<void> {
  await mongooseModel.findOneAndUpdate(
    {'year': tagList.year, 'semester': tagList.semester}, 
    {'tags': tagList.tags, 'updated_at': Date.now()}, 
    {upsert: true})
    .exec();
}

function fromMongooseDocument(doc: mongoose.Document): TagList {
  if (doc === null) return null;
  return {
    year: doc['year'],
    semester: doc['semester'],
    updated_at: getUpdateTimeFromMongooseDocument(doc),
    tags: doc['tags']
  };
}

// Issue #92. After all data converted to nubmer, remove this function
function getUpdateTimeFromMongooseDocument(doc: mongoose.Document): number {
  let updateTime = doc['updated_at'];
  if (updateTime instanceof Date) {
    return updateTime.getTime();
  } else if (typeof updateTime === 'number') {
    return updateTime;
  } else {
    throw new Error("Tag update time is neither Date or number");
  }
}
