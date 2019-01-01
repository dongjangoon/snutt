import User from '@app/core/user/model/User';

export function getUserFcmKeyName(user: User): string {
  return "user-" + user._id;
}
