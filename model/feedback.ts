/**
 * 유저로부터 피드백을 입력 받아 DB에 삽입
 */

import mongoose = require('mongoose');

export interface FeedbackDocument extends mongoose.Document {
  email: string,
  message: string,
  timestamp: number,
  platform: string
}

var FeedbackSchema = new mongoose.Schema({
  email: String,
  message: String,
  timestamp: Number,
  platform: String
});

FeedbackSchema.index({timestamp: -1});

let FeedbackModel = mongoose.model<FeedbackDocument>('Feedback', FeedbackSchema, 'feedbacks');

export async function insertFeedback(email: string, message: string, platform: string): Promise<void> {
  let feedback = {
    email: email,
    message: message,
    timestamp: Date.now(),
    platform: platform
  };
  var feedbackDocument = new FeedbackModel(feedback);
  await feedbackDocument.save();
}

export function getFeedback(limit: number, offset: number): Promise<FeedbackDocument[]> {
  return FeedbackModel.find().sort({'timestamp': 1}).skip(offset).limit(limit).exec();
}

export async function removeFeedback(ids: any[]): Promise<any> {
  return FeedbackModel.remove({_id: { $in: ids }}).exec();
}
