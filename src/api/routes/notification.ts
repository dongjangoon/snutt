import express = require('express');
var router = express.Router();
import NotificationService = require('@app/core/notification/NotificationService');
import User from '@app/core/user/model/User';
import UserService = require('@app/core/user/UserService');

import errcode = require('@app/api/errcode');
import * as log4js from 'log4js';
var logger = log4js.getLogger();

router.get('/', async function(req, res, next){
  var user:User = <User>req["user"];
  var offset, limit;
  if (!req.query.offset) offset = 0;
  else offset = Number(req.query.offset);
  if (!req.query.limit) limit = 20;
  else limit = Number(req.query.limit);

  try {
    let notification = await NotificationService.getNewestByUser(user, offset, limit);
    if (req.query.explicit) await UserService.updateNotificationCheckDate(user);
    res.json(notification);
  } catch (err) {
    logger.error(err);
    res.status(500).json({errcode:errcode.SERVER_FAULT, message: 'error'});
  }
});

router.get('/count', function(req, res, next){
  var user:User = <User>req["user"];
  NotificationService.countUnreadByUser(user).then(function(value){
    res.json({count: value});
  }, function(err) {
    logger.error(err);
    res.status(500).json({errcode:errcode.SERVER_FAULT, message: 'error'});
  });
});

export = router;
