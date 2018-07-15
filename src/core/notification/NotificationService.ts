import FcmService = require('@app/core/fcm/FcmService');
import FcmLogServie = require('@app/core/fcm/FcmLogService');
import NotificationRepository = require('./NotificationRepository');
import NoFcmKeyError from './error/NoFcmKeyError';

import User from '@app/core/user/model/User';
import Notification from './model/Notification';
import NotificationTypeEnum from './model/NotificationTypeEnum';
import InvalidNotificationDetailError from './error/InvalidNotificationDetailError';

export async function sendFcmMsg(user: User, title: string, body: string, author: string, cause: string) {
  if (!user.fcmKey) throw new NoFcmKeyError();
  let destination = user.fcmKey;
  let response = await FcmService.sendMsg(destination, title, body);
  await FcmLogServie.addFcmLog(user._id, author, title + '\n' + body, cause, response);
  return response;
}

export async function sendGlobalFcmMsg(title: string, body: string, author: string, cause: string) {
  let response = await FcmService.sendGlobalMsg(title, body);
  return response;
}

export function add(notification: Notification): Promise<void> {
  validateNotificationDetail(notification);
  return NotificationRepository.insert(notification);
}

function validateNotificationDetail(notification: Notification) {
  if (notification.type === NotificationTypeEnum.LINK_ADDR && typeof notification.detail !== 'string') {
    throw new InvalidNotificationDetailError(notification.type, notification.detail);
  }
}

export function getNewestByUser(user: User, offset: number, limit: number): Promise<Notification[]> {
  return NotificationRepository.findNewestByUser(user, offset, limit);
}

export function countUnreadByUser(user: User): Promise<number> {
  return NotificationRepository.countUnreadByUser(user);
}
