import express = require('express');
var router = express.Router();
import NotificationService = require('@app/core/notification/NotificationService');
import User from '@app/core/user/model/User';
import UserService = require('@app/core/user/UserService');

import * as log4js from 'log4js';
import { restGet } from '../decorator/RestDecorator';
var logger = log4js.getLogger();

restGet(router, '/')(async function(context, req){
  var user:User = context.user;
  var offset, limit;
  if (!req.query.offset) offset = 0;
  else offset = Number(req.query.offset);
  if (!req.query.limit) limit = 20;
  else limit = Number(req.query.limit);

  let notification = await NotificationService.getNewestByUser(user, offset, limit);
  if (req.query.explicit) await UserService.updateNotificationCheckDate(user);
  return notification;
});

restGet(router, '/count')(function(context, req){
  var user:User = context.user;
  return NotificationService.countUnreadByUser(user);
});

export = router;
