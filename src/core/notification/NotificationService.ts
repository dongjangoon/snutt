import errcode = require('@app/api/errcode');
import fcm = require('@app/core/fcm');
import { writeFcmLog } from '@app/core/model/fcmLog';

import User from '@app/core/user/model/User';

export async function sendFcmMsg(user: User, title: string, body: string, author: string, cause: string) {
  if (!user.fcmKey) throw errcode.USER_HAS_NO_FCM_KEY;
  let destination = user.fcmKey;
  let response = await fcm.sendMsg(destination, title, body);
  await writeFcmLog(user._id, author, title + '\n' + body, cause, response);
  return response;
}

export async function sendGlobalFcmMsg(title: string, body: string, author: string, cause: string) {
  let destination = "/topics/global";
  let response = await fcm.sendMsg(destination, title, body);
  await writeFcmLog("global", author, title + '\n' + body, cause, response);
  return response;
}
