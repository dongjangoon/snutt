
import FcmService = require('@app/core/fcm/FcmService');
import User from '@app/core/user/model/User';
import UserService = require('@app/core/user/UserService');

/*
* create_device
* Add this registration_id for the user
* and add topic
*/
export async function attachDevice(user: User, registrationId: string): Promise<void> {
  if (!user.fcmKey) await refreshFcmKey(user, registrationId);

  let keyName = "user-" + user._id;
  try {
    await FcmService.addDevice(keyName, user.fcmKey, [registrationId]);
  } catch (err) {
    await refreshFcmKey(user, registrationId);
    await FcmService.addDevice(keyName, user.fcmKey, [registrationId]);
  }

  await FcmService.addTopic(registrationId);
}

export async function detachDevice(user: User, registrationId: string): Promise<void> {
  if (!user.fcmKey) await refreshFcmKey(user, registrationId);

  let keyName = "user-" + user._id;
  try {
    await FcmService.removeDevice(keyName, user.fcmKey, [registrationId]);
  } catch (err) {
    await refreshFcmKey(user, registrationId);
    await FcmService.removeDevice(keyName, user.fcmKey, [registrationId]);
  }

  await FcmService.removeTopicBatch([registrationId]);
}

async function refreshFcmKey(user: User, registrationId: string): Promise<void> {
  var keyName = "user-" + user._id;
  var keyValue: string;

  try {
    keyValue = await FcmService.getNotiKey(keyName);
  } catch (err) {
    keyValue = await FcmService.createNotiKey(keyName, [registrationId]);
  }

  if (!keyValue) throw "refreshFcmKey failed";

  user.fcmKey = keyValue;
  UserService.modify(user);
}