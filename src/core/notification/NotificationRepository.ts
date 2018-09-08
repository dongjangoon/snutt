/**
 * Notification Model
 * Jang Ryeol, ryeolj5911@gmail.com
 */
import mongoose = require('mongoose');
import User from '@app/core/user/model/User';
import NotificationTypeEnum from './model/NotificationTypeEnum';
import Notification from './model/Notification';

var NotificationSchema = new mongoose.Schema({
  user_id : { type: mongoose.Schema.Types.ObjectId, ref: 'User', default : null},
  message : { type : String, required : true },
  created_at : { type : Date, required : true},
  type : { type: Number, required : true, default : NotificationTypeEnum.NORMAL },
  detail : { type: mongoose.Schema.Types.Mixed, default : null }
});

NotificationSchema.index({user_id: 1});
NotificationSchema.index({created_at: -1});

let mongooseModel = mongoose.model('Notification', NotificationSchema, 'notifications');

export async function findNewestByUser(user: User, offset: number, limit: number): Promise<Notification[]> {
  let query = {
    user_id: { $in: [ null, user._id ] },
    created_at: {$gt: user.regDate}
  };
  let mongooseDocs = await mongooseModel.find(query)
    .sort('-created_at')
    .skip(offset)
    .limit(limit)
    .exec();
  return mongooseDocs.map(fromMongoose);
}

export function countUnreadByUser(user: User): Promise<number> {
  return mongooseModel.where('user_id').in([null, user._id])
    .count({created_at : {$gt : user.notificationCheckedAt}})
    .exec();
}

export async function insert(notification: Notification): Promise<void> {
  await new mongooseModel(notification).save();
}

function fromMongoose(mongooseDoc): Notification {
  return {
    user_id: mongooseDoc.user_id,
    message: mongooseDoc.message,
    created_at: mongooseDoc.created_at,
    type: mongooseDoc.type,
    detail: mongooseDoc.detail
  }
}
