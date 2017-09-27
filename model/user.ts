import mongoose = require('mongoose');
import config = require('../config/config');
import bcrypt = require('bcrypt');
import crypto = require('crypto');
import errcode = require('../lib/errcode');
import {TimetableModel} from './timetable';
import {CourseBookModel} from './courseBook';
import {writeFcmLog} from './fcmLog';
import * as log4js from 'log4js';
import * as fcm from '../lib/fcm';
var logger = log4js.getLogger();

let UserSchema = new mongoose.Schema({
  credential : {
    localId: {type: String, default: null},
    localPw: {type: String, default: null},
    fbName: {type: String, default: null},
    fbId: {type: String, default: null},
    tempDate: {type: Date, default: null},
    tempSeed: {type: Number, default: null}
  },
  credentialHash : {type: String, default: null},
  isAdmin: {type: Boolean, default: false},
  regDate: {type: Date, default: Date.now()},
  notificationCheckedAt: {type: Date, default: Date.now()},
  email: String,
  fcmKey: String,

  // if the user remove its account, active status becomes false
  // Should not remove user object, because we must preserve the user data and its related objects
  active: {type: Boolean, default: true}
});

let MongooseUserModel = mongoose.model('User', UserSchema);

export class UserModel {
  _id: string;
  private credential : {
    localId?: string,
    localPw?: string,
    fbName?: string,
    fbId?: string,
    tempDate?: Date,
    tempSeed?: number
  };
  private credentialHash : string;
  isAdmin: boolean;
  private regDate: Date;
  private notificationCheckedAt: Date;
  email: string;
  fcmKey: string;
  active: boolean;

  mongooseDocument: mongoose.Document;

  constructor(mongooseDocument:mongoose.Document) {
    if (mongooseDocument === null) {
      logger.error("UserModel: mongoose document is null");
      throw "mongoose document is null";
    }
    let wrapper = <any>mongooseDocument;
    this._id = wrapper._id;
    this.credential = wrapper.credential;
    this.credentialHash = wrapper.credentialHash;
    this.isAdmin = wrapper.isAdmin;
    this.regDate = wrapper.regDate;
    this.notificationCheckedAt = wrapper.notificationCheckedAt;
    this.email = wrapper.email;
    this.fcmKey = wrapper.fcmKey;
    this.active = wrapper.active;

    this.mongooseDocument = mongooseDocument;
  }

  verifyPassword(password: string): Promise<boolean> {
    let originalHash = this.credential.localPw;
    if (!password || !originalHash) return Promise.resolve(false);
    return new Promise(function(resolve, reject) {
      bcrypt.compare(password, originalHash, function(err, same) {
        if (err) return reject(err);
        resolve(same);
      });
    });
  }

  getCredentialHash():string {
    return this.credentialHash;
  }

  private async saveCredential():Promise<void> {
    var hmac = crypto.createHmac('sha256', config.secretKey);
    hmac.update(JSON.stringify(this.credential));
    this.credentialHash = hmac.digest('hex');
    (<any>this.mongooseDocument).credential = this.credential;
    (<any>this.mongooseDocument).credentialHash = this.credentialHash;
    this.mongooseDocument = await this.mongooseDocument.save();
  }

  compareCredentialHash(hash: string):boolean {
    return this.credentialHash == hash;
  }

  async updateNotificationCheckDate(): Promise<void> {
    this.notificationCheckedAt = new Date();
    (<any>this.mongooseDocument).notificationCheckedAt = this.notificationCheckedAt;
    this.mongooseDocument = await this.mongooseDocument.save();
  }
  
  async changeLocalPassword(password:string): Promise<void> {
    if (!password ||
      !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i))
      return Promise.reject(errcode.INVALID_PASSWORD);

    let passwordHash = await new Promise<string>(function(resolve, reject) {
      bcrypt.hash(password, 4, function(err, encrypted) {
        if (err) return reject(err);
        resolve(encrypted);
      });
    });
    this.credential.localPw = passwordHash;
    this.saveCredential();
  }

  hasFb():boolean {
    return this.credential.fbId !== null;
  }

  attachFb(fbName:string, fbId:string):Promise<void> {
    if (!fbId) {
      var err = errcode.NO_FB_ID_OR_TOKEN;
      return Promise.reject(err);
    }
    this.credential.fbName = fbName;
    this.credential.fbId = fbId;
    return this.saveCredential();
  }

  detachFb():Promise<void> {
    if (!this.credential.localId) {
      var err = errcode.NOT_LOCAL_ACCOUNT;
      return Promise.reject(err);
    }
    this.credential.fbName = null;
    this.credential.fbId = null;
    return this.saveCredential();
  };

  hasLocal():boolean {
    return this.credential.localId !== null;
  }

  attachLocal(id:string, password:string):Promise<void> {
    if (!id || !id.match(/^[a-z0-9]{4,32}$/i)) {
      var err = errcode.INVALID_ID;
      return Promise.reject(err);
    }

    if (!password || !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i)) {
      var err = errcode.INVALID_PASSWORD;
      return Promise.reject(err);
    }

    this.credential.localId = id;
    return this.changeLocalPassword(password);
  }

  getUserInfo() {
    return {
      isAdmin: this.isAdmin,
      regDate: this.regDate,
      notificationCheckedAt: this.notificationCheckedAt,
      email: this.email,
      local_id: this.credential.localId,
      fb_name: this.credential.fbName
    }
  }

  getFbName() {
    return this.credential.fbName;
  }

  async deactivate() {
    this.active = false;
    (<any>this.mongooseDocument).active = this.active;
    this.mongooseDocument = await this.mongooseDocument.save();
  }

  async setUserInfo(email: string): Promise<void> {
    this.email = email;
    (<any>this.mongooseDocument).email = this.email;
    this.mongooseDocument = await this.mongooseDocument.save();
  }

  async refreshFcmKey(registration_id:string): Promise<void> {
    var keyName = "user-"+this._id;
    var keyValue: string;

    try {
      keyValue = await fcm.getNotiKey(keyName);
    } catch (err) {
      keyValue = await fcm.createNotiKey(keyName, [registration_id]);
    }

    if (!keyValue) throw "refreshFcmKey failed";

    this.fcmKey = keyValue;
    (<any>this.mongooseDocument).fcmKey = this.fcmKey;
    this.mongooseDocument = await this.mongooseDocument.save();
  }

  /*
  * create_device
  * Add this registration_id for the user
  * and add topic
  */
  async attachDevice(registration_id:string): Promise<void> {
    if (!this.fcmKey) await this.refreshFcmKey(registration_id);

    let keyName = "user-"+this._id;
    try {
      await fcm.addDevice(keyName, this.fcmKey, [registration_id]);
    } catch (err) {
      await this.refreshFcmKey(registration_id);
      await fcm.addDevice(keyName, this.fcmKey, [registration_id]);
    }

    await fcm.addTopic(registration_id);
  }

  async detachDevice(registration_id:string): Promise<void> {
    if (!this.fcmKey) await this.refreshFcmKey(registration_id);
    
    let keyName = "user-"+this._id;
    try {
      await fcm.removeDevice(keyName, this.fcmKey, [registration_id]);
    } catch (err) {
      await this.refreshFcmKey(registration_id);
      await fcm.removeDevice(keyName, this.fcmKey, [registration_id]);
    }

    await fcm.removeTopicBatch([registration_id]);
  }

  async sendFcmMsg(message: string, author: string, cause: string) {
    if (!this.fcmKey) throw errcode.USER_HAS_NO_FCM_KEY;
    let destination = this.fcmKey;
    let notificationData = {
      "notification" : {
        "body" : message,
        "title" : "SNUTT"
      }
    };
    let response = await fcm.sendDataMsg(destination, notificationData);
    await writeFcmLog(destination, author, message, cause, response);
    return response;
  }

  getRegDate(): Date {
    return this.regDate;
  }

  private async createDefaultTimetable(): Promise<TimetableModel> {
    let userId = this._id;
    return CourseBookModel.getRecent({lean:true}).then(function(coursebook){
      return TimetableModel.createFromParam({
        user_id : userId,
        year : coursebook.year,
        semester : coursebook.semester,
        title : "나의 시간표"});
    });
  }

  static async sendGlobalFcmMsg(message: string, author: string, cause: string) {
    let destination = "/topics/global";
    let notificationData = {
      "notification" : {
        "body" : message,
        "title" : "SNUTT"
      }
    };
    let response = await fcm.sendDataMsg(destination, notificationData);
    await writeFcmLog(destination, author, message, cause, response);
    return response;
  }

  static getUserFromCredentialHash(hash:string) : Promise<UserModel> {
    if (!hash) {
      return Promise.reject(errcode.SERVER_FAULT);
    } else {
      return mongoose.model('User').findOne({
        'credentialHash' : hash,
        'active' : true
      }).exec().then(function(mongooseDocument) {
        if (mongooseDocument === null) return null;
        return Promise.resolve(new UserModel(mongooseDocument));
      });
    }
  }

  static getByMongooseId(mid:string) : Promise<UserModel> {
    return MongooseUserModel.findOne({'_id' : mid, 'active' : true })
    .exec().then(function(userDocument){
      if (userDocument === null) return null;
      return Promise.resolve(new UserModel(userDocument));
    });
  }

  static getByLocalId(id:string) : Promise<UserModel> {
    return MongooseUserModel.findOne({'credential.localId' : id, 'active' : true })
    .exec().then(function(userDocument){
      if (userDocument === null) return null;
      return Promise.resolve(new UserModel(userDocument));
    });
  }

  static async createLocal(id:string, password:string) : Promise<UserModel> {
    if (!id) throw errcode.INVALID_ID;
    if (!password) throw errcode.INVALID_PASSWORD;
    if (await UserModel.getByLocalId(id)) {
      throw errcode.DUPLICATE_ID;
    }
    let mongooseDocument = new MongooseUserModel();
    let user = new UserModel(mongooseDocument);
    await Promise.all([user.attachLocal(id, password), user.createDefaultTimetable()]);
    return user;
  }
  
  static async getByFb(name:string, id:string) : Promise<UserModel> {
    let mongooseDocument = await MongooseUserModel.findOne({'credential.fbId' : id, 'active' : true }).exec();
    if (mongooseDocument === null) return null;
    return new UserModel(mongooseDocument);
  }

  static async createFb(name:string, id:string): Promise<UserModel> {
    let mongooseDocument = new MongooseUserModel();
    let user = new UserModel(mongooseDocument);
    await Promise.all([user.attachFb(name, id), user.createDefaultTimetable()]);
    return user;
  }

  static async getFbOrCreate(name:string, id:string) : Promise<UserModel> {
    let user = await UserModel.getByFb(name, id);
    if (user) return user;
    else return UserModel.createFb(name, id);
  }

  static async createTemp() : Promise<UserModel> {
    let mongooseDocument = new MongooseUserModel();
    let user = new UserModel(mongooseDocument);
    user.credential = {
      tempDate: new Date(),
      tempSeed: Math.floor(Math.random() * 1000)
    }
    await Promise.all([user.saveCredential(), user.createDefaultTimetable()]);
    return user;
  }
}
