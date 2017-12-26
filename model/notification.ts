/**
 * Notification Model
 * Jang Ryeol, ryeolj5911@gmail.com
 */
import mongoose = require('mongoose');
import errcode = require('../lib/errcode');
import {UserModel} from './user';
import fcm = require('../lib/fcm');

export interface NotificationDocument extends mongoose.Document{
  user_id : mongoose.Schema.Types.ObjectId,
  message : String,
  created_at : Date,
  type : Number,
  detail : mongoose.Schema.Types.Mixed,
  fcm_status : String
}

interface _NotificationModel extends mongoose.Model<NotificationDocument>{
  getNewest(user:UserModel, offset:number, limit:number,
      cb?:(err, docs:mongoose.Types.DocumentArray<NotificationDocument>)=>void)
      :Promise<mongoose.Types.DocumentArray<NotificationDocument>>;
  countUnread(user:UserModel, cb?:(err, count:number)=>void):Promise<number>;
  createNotification(user_id:string, message:string, type:Number, detail:any, fcm_status:string):Promise<NotificationDocument>;
}

var NotificationSchema = new mongoose.Schema({
  user_id : { type: mongoose.Schema.Types.ObjectId, ref: 'User', default : null},
  message : { type : String, required : true },
  created_at : { type : Date, required : true},
  type : { type: Number, required : true, default : 0 },
  detail : { type: mongoose.Schema.Types.Mixed, default : null },
  fcm_status : { type : String, default : null }
});

NotificationSchema.index({user_id: 1});
NotificationSchema.index({created_at: -1});

NotificationSchema.statics.getNewest = function (user: UserModel, offset, limit, callback) {
  let query = {
      user_id: { $in: [ null, user._id ] }
    };
  let regDate = user.getRegDate();
  if (regDate) query["created_at"] = { $gt: regDate }
  return NotificationModel.find(query)
    .sort('-created_at')
    .skip(offset)
    .limit(limit)
    .lean()
    .exec(callback);
};

NotificationSchema.statics.countUnread = function (user, callback) {
  return NotificationModel.where('user_id').in([null, user._id])
    .count({created_at : {$gt : user.notificationCheckedAt}})
    .exec(callback);
};

/**
 * Types
 * - Type.NORMAL      : Normal Messages. Detail would be null
 * - Type.COURSEBOOK  : Course Book Changes. Detail contains lecture difference
 * - Type.LECTURE     : Lecture Changes. Course book changes are for all users.
 *                      Lecture changes contains per-user update log.
 * - Type.LINK_ADDR   : 사용자가 클릭하면 브라우저로 연결되도록 하는 알림
 */
export let Type = {
  NORMAL : 0,
  COURSEBOOK : 1,
  LECTURE_UPDATE : 2,
  LECTURE_REMOVE : 3,
  LINK_ADDR : 4
};

// if user_id_array is null or not array, create it as global
NotificationSchema.statics.createNotification = function (user_id, message, type, detail, fcm_status) {
  if (!type) type = 0;
  if (type == Type.LINK_ADDR && typeof(detail) != "string") return Promise.reject(errcode.INVALID_NOTIFICATION_DETAIL);
  var notification = new NotificationModel({
    user_id : user_id,
    message : message,
    created_at : Date.now(),
    type : type,
    detail : detail,
    fcm_status : fcm_status
  });

  return notification.save();
};

export let NotificationModel = <_NotificationModel>mongoose.model<NotificationDocument>('Notification', NotificationSchema);
