/**
 * 외부 Admin 모듈과 http 통신.
 * Admin 권한을 가진 user만이 사용 가능
 */
import express = require('express');
import errcode = require('@app/api/errcode');
import User from '@app/core/user/model/User';
import UserService = require('@app/core/user/UserService');
import NotificationService = require('@app/core/notification/NotificationService');
import {CourseBookModel} from '@app/core/model/courseBook';
import FcmLogService = require('@app/core/fcm/FcmLogService');
import {getFeedback} from '@app/core/model/feedback';
import {getStatistics} from '@app/core/model/admin';
import {NotificationModel, Type as NotificationType} from '@app/core/model/notification';
import * as log4js from 'log4js';
import NoFcmKeyError from '@app/core/notification/error/NoFcmKeyError';
var logger = log4js.getLogger();

var router = express.Router();

router.use(function(req, res, next) {
  if (req["user"].isAdmin) return next();
  else {
    return res.status(403).json({ errcode: errcode.NO_ADMIN_PRIVILEGE, message: 'Admin privilege required.' });
  }
});

router.post('/insert_noti', async function(req, res, next) {
  let sender: User = req["user"];

  let userId: string     = req.body.user_id;
  let title: string      = req.body.title;
  let body: string       = req.body.body;
  let insertFcm: boolean = req.body.insert_fcm ? true            : false;
  let type               = req.body.type       ? req.body.type   : NotificationType.NORMAL;
  let detail             = req.body.detail     ? req.body.detail : null;

  try {
    if (userId && userId.length > 0) {
      let receiver = await UserService.getByLocalId(userId);
      if (insertFcm) {
        await NotificationService.sendFcmMsg(receiver, title, body, sender._id, "admin");
      }
      await NotificationModel.createNotification(receiver._id, body, type, detail);
    } else {
      if (insertFcm) {
        await NotificationService.sendGlobalFcmMsg(title, body, sender._id, "admin");
      }
      await NotificationModel.createNotification(null, body, type, detail);
    }
    res.send({message: "ok"});
  } catch (err) {
    if (err == errcode.USER_NOT_FOUND) return res.status(404).send({errcode: err, message: "user not found"});
    if (err instanceof NoFcmKeyError) return res.status(404).send({errcode: errcode.USER_HAS_NO_FCM_KEY, message: "user has no fcm key"});
    if (err == errcode.INVALID_NOTIFICATION_DETAIL) return res.status(404).send({errcode: err, message: "invalid notification detail"});
    logger.error(err);
    res.status(500).send({errcode: errcode.SERVER_FAULT, message:err});
  }
});

router.get('/recent_fcm_log', async function(req, res, next) {
  let logs = await FcmLogService.getRecentFcmLog();
  return res.json(logs);
});

router.get('/coursebooks', async function(req, res, next) {
  let coursebooks = await CourseBookModel.getAll();
  return res.json(coursebooks);
});

router.get('/feedbacks', async function(req, res, next) {
  let limit = 10;
  let offset = 0;
  if (req.body.limit) limit = req.body.limit;
  if (req.body.offset) offset = req.body.offset;
  let feedbacks = await getFeedback(limit, offset);
  return res.json(feedbacks);
});

router.get('/statistics', async function(req, res, next) {
  let statistics = await getStatistics();
  return res.json(statistics);
});

/*
var path = require('path');
var CourseBook = require(path.join(__dirname, 'model/courseBook'));


router.get('/course_books', function(req, res, next) {
  CourseBook.find({},'year semester', {sort : {year : -1, semester : -1 }}, function (err, courseBooks) {
    res.send(200, courseBooks)
  });
});
*/

export = router;