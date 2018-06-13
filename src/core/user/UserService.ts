import property = require('@app/core/config/property');
import bcrypt = require('bcrypt');
import crypto = require('crypto');
import errcode = require('../errcode');
import { TimetableModel } from '@app/core/model/timetable';
import { CourseBookModel } from '@app/core/model/courseBook';
import * as log4js from 'log4js';
import * as fcm from '../fcm';
import UserRepository = require('@app/core/user/UserRepository');

import User from '@app/core/user/model/User';
import UserCredential from '@app/core/user/model/UserCredential';
import UserInfo from './model/UserInfo';

var logger = log4js.getLogger();

export function getByMongooseId(mongooseId: string): Promise<User> {
  return UserRepository.findActiveByMongooseId(mongooseId);
}

export function getByLocalId(localId: string): Promise<User> {
  return UserRepository.findActiveByLocalId(localId);
}

export function verifyPassword(user: User, password: string): Promise<boolean> {
  let originalHash = user.credential.localPw;
  if (!password || !originalHash) return Promise.resolve(false);
  return new Promise(function (resolve, reject) {
    bcrypt.compare(password, originalHash, function (err, same) {
      if (err) return reject(err);
      resolve(same);
    });
  });
}

export function compareCredentialHash(user: User, hash: string): boolean {
  return user.credentialHash === hash;
}

function makeCredentialHmac(userCredential: UserCredential): string {
  var hmac = crypto.createHmac('sha256', property.secretKey);
  hmac.update(JSON.stringify(userCredential));
  return hmac.digest('hex');
}

async function saveCredential(user: User): Promise<void> {
  user.credentialHash = makeCredentialHmac(user.credential);
  UserRepository.update(user);
}

export async function updateNotificationCheckDate(user: User): Promise<void> {
  user.notificationCheckedAt = new Date();
  UserRepository.update(user);
}

function validatePassword(password: string): Promise<void> {
  if (!password || !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i)) {
    return Promise.reject(errcode.INVALID_PASSWORD);
  } else {
    return Promise.resolve();
  }
}

function makePasswordHash(password: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    bcrypt.hash(password, 4, function (err, encrypted) {
      if (err) return reject(err);
      resolve(encrypted);
    });
  });
}

export async function changeLocalPassword(user:User, password: string): Promise<void> {
  await validatePassword(password);
  let passwordHash = await makePasswordHash(password);
  user.credential.localPw = passwordHash;
  saveCredential(user);
}

export function hasFb(user: User): boolean {
  return !(user.credential.fbId === null || user.credential.fbId === undefined);
}

export function hasLocal(user: User): boolean {
  return user.credential.localId !== null;
}

export async function attachFb(user: User, fbName: string, fbId: string): Promise<void> {
  if (!fbId) {
    var err = errcode.NO_FB_ID_OR_TOKEN;
    return Promise.reject(err);
  }
  this.credential.fbName = fbName;
  this.credential.fbId = fbId;
  await this.saveCredential();
}

export async function detachFb(user: User): Promise<void> {
  if (!hasLocal(user)) {
    var err = errcode.NOT_LOCAL_ACCOUNT;
    return Promise.reject(err);
  }
  this.credential.fbName = null;
  this.credential.fbId = null;
  await this.saveCredential();
}

export async function attachLocal(user: User, id: string, password: string): Promise<void> {
  if (!id || !id.match(/^[a-z0-9]{4,32}$/i)) {
    throw errcode.INVALID_ID;
  }

  if (await UserRepository.findActiveByLocalId(id)) {
    throw errcode.DUPLICATE_ID;
  }

  user.credential.localId = id;
  await changeLocalPassword(user, password);
}

export function getUserInfo(user: User): UserInfo {
  return {
    isAdmin: user.isAdmin,
    regDate: user.regDate,
    notificationCheckedAt: user.notificationCheckedAt,
    email: user.email,
    local_id: user.credential.localId,
    fb_name: user.credential.fbName
  }
}

export async function deactivate(user: User): Promise<void> {
  user.active = false;
  UserRepository.update(user);
}

export async function setUserInfo(user: User, email: string): Promise<void> {
  user.email = email;
  UserRepository.update(user);
}

async function refreshFcmKey(user:User, registrationId: string): Promise<void> {
  var keyName = "user-" + user._id;
  var keyValue: string;

  try {
    keyValue = await fcm.getNotiKey(keyName);
  } catch (err) {
    keyValue = await fcm.createNotiKey(keyName, [registrationId]);
  }

  if (!keyValue) throw "refreshFcmKey failed";

  user.fcmKey = keyValue;
  UserRepository.update(user);
}

/*
* create_device
* Add this registration_id for the user
* and add topic
*/
export async function attachDevice(user:User, registrationId: string): Promise<void> {
  if (!user.fcmKey) await refreshFcmKey(user, registrationId);

  let keyName = "user-" + user._id;
  try {
    await fcm.addDevice(keyName, user.fcmKey, [registrationId]);
  } catch (err) {
    await refreshFcmKey(user, registrationId);
    await fcm.addDevice(keyName, user.fcmKey, [registrationId]);
  }

  await fcm.addTopic(registrationId);
}

export function modifyLastLoginTimestamp(user: User): void {
  UserRepository.updateLastLoginTimestamp(user);
}

export async function detachDevice(user: User, registrationId: string): Promise<void> {
  if (!user.fcmKey) await refreshFcmKey(user, registrationId);

  let keyName = "user-" + user._id;
  try {
    await fcm.removeDevice(keyName, user.fcmKey, [registrationId]);
  } catch (err) {
    await refreshFcmKey(user, registrationId);
    await fcm.removeDevice(keyName, user.fcmKey, [registrationId]);
  }

  await fcm.removeTopicBatch([registrationId]);
}

async function createDefaultTimetable(user: User): Promise<TimetableModel> {
  let userId = user._id;
  let coursebook = await CourseBookModel.getRecent();
  return await TimetableModel.createFromParam({
    user_id: userId,
    year: coursebook.year,
    semester: coursebook.semester,
    title: "나의 시간표"
  });
}

export async function add(): Promise<User> {
  let user: User = {
    regDate: new Date,
    lastLoginTimestamp: Date.now()
  };

  await createDefaultTimetable(user);
  return user;
}

  private static async create(): Promise<UserModel> {
    let mongooseDocument = new MongooseUserModel({ regDate: new Date, lastLoginTimestamp: Date.now() });
    let user = new UserModel(mongooseDocument);
    await user.createDefaultTimetable();
    return user;
  }

  static async createLocal(id: string, password: string): Promise<UserModel> {
    let user = await this.create();
    await user.attachLocal(id, password);
    return user;
  }



  static async createFb(name: string, id: string): Promise<UserModel> {
    let user = await this.create();
    await user.attachFb(name, id);
    return user;
  }

  static async getFbOrCreate(name: string, id: string): Promise<UserModel> {
    let user = await UserModel.getByFb(name, id);
    if (user) return user;
    else return UserModel.createFb(name, id);
  }

  static async createTemp(): Promise<UserModel> {
    let user = await this.create();
    user.credential = {
      tempDate: new Date(),
      tempSeed: Math.floor(Math.random() * 1000)
    }
    await user.saveCredential();
    return user;
  }
}
