import UserCredential from '@app/core/user/model/UserCredential';

export default interface User {
  _id?: string;
  credential: UserCredential;
  credentialHash: string;
  isAdmin: boolean;
  regDate: Date;
  notificationCheckedAt: Date;
  email: string;
  fcmKey: string;
  active: boolean;
  lastLoginTimestamp: number;
}
