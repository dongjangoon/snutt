/**
 * 유저로부터 피드백을 입력 받아 DB에 삽입
 */

import mongoose = require('mongoose');

interface FeedbackDocument extends mongoose.Document {
  email: string,
  message: string,
  timestamp: number
}

var FeedbackSchema = new mongoose.Schema({
  email: String,
  message: String,
  timestamp: Number
});

FeedbackSchema.index({timestamp: -1});

let FeedbackModel = mongoose.model<FeedbackDocument>('Feedback', FeedbackSchema);

export async function insertFeedback(email: string, message: string): Promise<void> {
  let feedback = {
    email: email,
    message: message,
    timestamp: Date.now()
  };
  var feedbackDocument = new FeedbackModel(feedback);
  await feedbackDocument.save();
}

export function getFeedback(limit: number, offset: number): Promise<any[]> {
  return FeedbackModel.find().sort({'timestamp': -1}).skip(offset).limit(limit).exec();
}