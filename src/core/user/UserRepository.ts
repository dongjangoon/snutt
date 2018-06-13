import mongoose = require('mongoose');
import log4js = require('log4js');

import User from '@app/core/user/model/User';
import errcode = require('@app/core/errcode');

var logger = log4js.getLogger();

let UserSchema = new mongoose.Schema({
  credential : {
    localId: {type: String, default: null},
    localPw: {type: String, default: null},
    fbName: {type: String, default: null},
    fbId: {type: String, default: null},

    // 위 항목이 없어도 unique credentialHash을 생성할 수 있도록
    tempDate: {type: Date, default: null},          // 임시 가입 날짜
    tempSeed: {type: Number, default: null}         // 랜덤 seed
  },
  credentialHash : {type: String, default: null},   // credential이 변경될 때 마다 SHA 해싱 (model/user.ts 참조)
  isAdmin: {type: Boolean, default: false},         // admin 항목 접근 권한
  regDate: Date,                                    // 회원가입 날짜
  lastLoginTimestamp: Number,                       // routes/api/api.ts의 토큰 인증에서 업데이트
  notificationCheckedAt: Date,                      // 새로운 알림이 있는지 확인하는 용도
  email: String,
  fcmKey: String,                                   // Firebase Message Key
  
  // if the user remove its account, active status becomes false
  // Should not remove user object, because we must preserve the user data and its related objects
  active: {type: Boolean, default: true}
});
  
UserSchema.index({ credentialHash : 1 })            // 토큰 인증 시
UserSchema.index({ "credential.localId": 1 })       // ID로 로그인 시
UserSchema.index({ "credential.fbId": 1 })          // 페이스북으로 로그인 시

let MongooseUserModel = mongoose.model('User', UserSchema ,'users');

function fromMongoose(mongooseDocument: mongoose.MongooseDocument): User {
  if (mongooseDocument === null) {
    return null;
  }

  let wrapper = <any>mongooseDocument;
  return {
    _id: wrapper._id,
    credential: wrapper.credential,
    credentialHash: wrapper.credentialHash,
    isAdmin: wrapper.isAdmin,
    regDate: wrapper.regDate,
    notificationCheckedAt: wrapper.notificationCheckedAt,
    email: wrapper.email,
    fcmKey: wrapper.fcmKey,
    active: wrapper.active,
    lastLoginTimestamp: wrapper.lastLoginTimestamp
  }
}

export async function findActiveByFb(name:string, id:string) : Promise<User> {
  let mongooseDocument = await MongooseUserModel.findOne({'credential.fbId' : id, 'active' : true }).exec();
  return fromMongoose(mongooseDocument);
}

export async function findActiveByCredentialHash(hash: string): Promise<User> {
  if (!hash) {
    throw errcode.SERVER_FAULT;
  }
  let mongooseDocument = await MongooseUserModel.findOne({'credentialHash' : hash, 'active' : true }).exec();
  return fromMongoose(mongooseDocument);
}

export async function findActiveByMongooseId(mid: string): Promise<User> {
  return MongooseUserModel.findOne({ '_id': mid, 'active': true })
    .exec().then(function (userDocument) {
      return fromMongoose(userDocument);
    });
}

export async function findActiveByLocalId(id: string): Promise<User> {
  return MongooseUserModel.findOne({ 'credential.localId': id, 'active': true })
    .exec().then(function (userDocument) {
      return fromMongoose(userDocument);
    });
}

export async function update(user: User): Promise<void> {
  MongooseUserModel.findOne({ '_id': user._id })
    .exec().then(function (userDocument: any) {
      userDocument.credential = user.credential;
      userDocument.credentialHash = user.credentialHash;
      userDocument.isAdmin = user.isAdmin;
      userDocument.regDate = user.regDate;
      userDocument.notificationCheckedAt = user.notificationCheckedAt;
      userDocument.email = user.email;
      userDocument.fcmKey = user.fcmKey;
      userDocument.active = user.active;
      userDocument.lastLoginTimestamp = user.lastLoginTimestamp;
      userDocument.save();
    })
}

export async function add(user: User): Promise<void> {
  await new MongooseUserModel(user).save();
}

export function updateLastLoginTimestamp(user: User): void {
  let timestamp = Date.now();
  // Mongoose를 사용하면 성능이 저하되므로, raw mongodb를 사용한다.
  mongoose.connection.db.collection('users').updateOne({ _id: user._id }, { $set: { lastLoginTimestamp: timestamp } })
    .catch(function (err) {
      logger.error("Failed to update timestamp");
      logger.error(err);
    });
  this.lastLoginTimestamp = timestamp;
}
