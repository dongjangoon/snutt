/**
 * 외부 Admin 모듈과 http 통신.
 * Admin 권한을 가진 user만이 사용 가능
 */
import express = require('express');
import errcode = require('@app/api/errcode');
import User from '@app/core/user/model/User';
import UserService = require('@app/core/user/UserService');
import NotificationService = require('@app/core/notification/NotificationService');
import CourseBookService = require('@app/core/coursebook/CourseBookService');
import FcmLogService = require('@app/core/fcm/FcmLogService');
import FeedbackService = require('@app/core/feedback/FeedbackService');
import AdminService = require('@app/core/admin/AdminService');
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import * as log4js from 'log4js';
import NoFcmKeyError from '@app/core/notification/error/NoFcmKeyError';
import InvalidNotificationDetailError from '@app/core/notification/error/InvalidNotificationDetailError';
import RequestContext from '../model/RequestContext';
var logger = log4js.getLogger();

var router = express.Router();

router.use(function(req, res, next) {
  let context: RequestContext = req['context'];
  if (context.user.isAdmin) return next();
  else {
    return res.status(403).json({ errcode: errcode.NO_ADMIN_PRIVILEGE, message: 'Admin privilege required.' });
  }
});

router.post('/insert_noti', async function(req, res, next) {
  let context: RequestContext = req['context'];
  let sender: User = context.user;

  let userId: string     = req.body.user_id;
  let title: string      = req.body.title;
  let body: string       = req.body.body;
  let insertFcm: boolean = req.body.insert_fcm ? true            : false;
  let type               = req.body.type       ? Number(req.body.type)   : NotificationTypeEnum.NORMAL;
  let detail             = req.body.detail     ? req.body.detail : null;

  try {
    if (userId && userId.length > 0) {
      let receiver = await UserService.getByLocalId(userId);
      if (!receiver) {
        return res.status(404).send({errcode: errcode.USER_NOT_FOUND, message: "user not found"});
      }
      if (insertFcm) {
        await NotificationService.sendFcmMsg(receiver, title, body, sender._id, "admin");
      }
      await NotificationService.add({
        user_id: receiver._id,
        message: body,
        type: type,
        detail: detail,
        created_at: new Date()
      });
    } else {
      if (insertFcm) {
        await NotificationService.sendGlobalFcmMsg(title, body, sender._id, "admin");
      }
      await NotificationService.add({
        user_id: null,
        message: body,
        type: type,
        detail: detail,
        created_at: new Date()
      });
    }
    res.send({message: "ok"});
  } catch (err) {
    if (err instanceof NoFcmKeyError)
      return res.status(404).send({errcode: errcode.USER_HAS_NO_FCM_KEY, message: "user has no fcm key"});
    if (err instanceof InvalidNotificationDetailError)
      return res.status(404).send({errcode: err, message: "invalid notification detail"});
    logger.error(err);
    res.status(500).send({errcode: errcode.SERVER_FAULT, message:err});
  }
});

router.get('/recent_fcm_log', async function(req, res, next) {
  let logs = await FcmLogService.getRecentFcmLog();
  return res.json(logs);
});

router.get('/coursebooks', async function(req, res, next) {
  let coursebooks = await CourseBookService.getAll();
  return res.json(coursebooks);
});

router.get('/feedbacks', async function(req, res, next) {
  let limit = 10;
  let offset = 0;
  if (req.body.limit) limit = req.body.limit;
  if (req.body.offset) offset = req.body.offset;
  let feedbacks = await FeedbackService.get(limit, offset);
  return res.json(feedbacks);
});

router.get('/statistics', async function(req, res, next) {
  let statistics = await AdminService.getStatistics();
  return res.json(statistics);
});

export = router;