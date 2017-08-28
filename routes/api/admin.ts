/**
 * 외부 Admin 모듈과 http 통신.
 * Admin 권한을 가진 user만이 사용 가능
 */
import express = require('express');
import errcode = require('../../lib/errcode');
import {UserModel} from '../../model/user';
import * as log4js from 'log4js';
var logger = log4js.getLogger();

var router = express.Router();

router.use(function(req, res, next) {
  if (req["user"].isAdmin) return next();
  else {
    return res.status(403).json({ errcode: errcode.NO_ADMIN_PRIVILEGE, message: 'Admin privilege required.' });
  }
});

router.post('/send_fcm', async function(req, res, next) {
  let sender: UserModel = req["user"];
  let response: string;
  try {
    if (req.body.user_id && req.body.user_id.length > 0) {
      let receiver = await UserModel.getByLocalId(req.body.user_id);
      response = await receiver.sendFcmMsg(req.body.message, sender._id, "admin");
    } else {
      response = await UserModel.sendGlobalFcmMsg(req.body.message, sender._id, "admin");
    }
    res.send(response);
  } catch (err) {
    logger.error(err);
    res.status(500).send({errcode: errcode.SERVER_FAULT, message:err});
  }
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