import FcmService = require('@app/core/fcm/FcmService');
import FcmLogServie = require('@app/core/fcm/FcmLogService');
import NoFcmKeyError from './error/NoFcmKeyError';

import User from '@app/core/user/model/User';

export async function sendFcmMsg(user: User, title: string, body: string, author: string, cause: string) {
  if (!user.fcmKey) throw new NoFcmKeyError();
  let destination = user.fcmKey;
  let response = await FcmService.sendMsg(destination, title, body);
  await FcmLogServie.addFcmLog(user._id, author, title + '\n' + body, cause, response);
  return response;
}

export async function sendGlobalFcmMsg(title: string, body: string, author: string, cause: string) {
  let response = await FcmService.sendGlobalMsg(title, body);
  await FcmLogServie.addFcmLog("global", author, title + '\n' + body, cause, response);
  return response;
}
