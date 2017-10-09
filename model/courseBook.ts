import mongoose = require('mongoose');

export interface CourseBookDocument extends mongoose.Document{
  year: number,
  semester: number,
  updated_at: number
}

interface _CourseBookModel extends mongoose.Model<CourseBookDocument>{
  getAll():Promise<mongoose.Types.DocumentArray<CourseBookDocument>>;
  getRecent():Promise<CourseBookDocument>;
}

var CourseBookSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  updated_at: {type: Number, default: Date.now()}
});

CourseBookSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

CourseBookSchema.statics.getAll = function() {
  var query:mongoose.Query<any> = CourseBookModel.find({}, '-_id year semester updated_at')
  .sort([["year", -1], ["semester", -1]]);
  return query.exec();
};

CourseBookSchema.statics.getRecent = function() {
  var query:mongoose.Query<any> = CourseBookModel.findOne({}, '-_id year semester updated_at')
  .sort([["year", -1], ["semester", -1]]);
  return query.exec();
};

export let CourseBookModel = <_CourseBookModel>mongoose.model<CourseBookDocument>('CourseBook', CourseBookSchema);
