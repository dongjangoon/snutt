/**
 * Deprecated Since 2.2.0
 */

import mongoose = require('mongoose');
import Feedback from './model/Feedback';

var FeedbackSchema = new mongoose.Schema({
  email: String,
  message: String,
  timestamp: Number,
  platform: String
});

FeedbackSchema.index({timestamp: -1});

let FeedbackModel = mongoose.model('Feedback', FeedbackSchema, 'feedbacks');

// deprecated
export async function insert(feedback: Feedback): Promise<void> {
  var feedbackDocument = new FeedbackModel(feedback);
  await feedbackDocument.save();
}

export async function findByPaging(limit: number, offset: number): Promise<Feedback[]> {
  let docs = await FeedbackModel.find().sort({'timestamp': 1}).skip(offset).limit(limit).exec();
  return docs.map(fromMongoose);
}

export function deleteOne(id: string) {
  return FeedbackModel.remove({_id: id}).exec();
}

export function deleteAllByMongoIds(ids: any[]): Promise<void> {
  return FeedbackModel.remove({_id: { $in: ids }}).exec();
}

function fromMongoose(doc): Feedback {
    if (doc == null) return doc;
    return {
        _id: doc['_id'],
        email: doc['email'],
        message: doc['message'],
        timestamp: doc['timestamp'],
        platform: doc['platform'],
    }
}
