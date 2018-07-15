import mongoose = require('mongoose');

import FcmLog from '@app/core/fcm/model/FcmLog';

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
  
export async function insertFcmLog(fcmLog: FcmLog): Promise<void> {
    var log = new mongooseModel(fcmLog);
    log.save();
}

export async function findRecentFcmLog(): Promise<FcmLog[]>{
    let mongoDocs = await mongooseModel.find().sort({date: -1}).limit(10).exec();
    return mongoDocs.map(fromMongooseModel);
}

function fromMongooseModel(mongooseDoc: any): FcmLog {
    let fcmLog: FcmLog = {
        date: mongooseDoc.date,
        author: mongooseDoc.author,
        cause: mongooseDoc.cause,
        to: mongooseDoc.to,
        message: mongooseDoc.message,
        response: mongooseDoc.response
    }
    return fcmLog;
}
