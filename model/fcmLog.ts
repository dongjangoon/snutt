import mongoose = require('mongoose');

var FcmLogSchema = new mongoose.Schema({
  date: Date,
  author: String,
  to: String,
  message: String,
  cause: String,
  response: String
});

FcmLogSchema.index({date: -1})

var mongooseModel = mongoose.model('FcmLog', FcmLogSchema, 'fcmlogs');

export function writeFcmLog(to: string, author: string, message: string, cause: string, response: any) {
  var log = new mongooseModel({
    date: Date.now(),
    author: author,
    cause: cause,
    to : to,
    message: message,
    response: JSON.stringify(response)
  });
  return log.save();
}

export function getRecentFcmLog(): Promise<any[]>{
  return mongooseModel.find().sort({date: -1}).limit(10).exec();
}
