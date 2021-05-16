import { UserEntity } from '../../schemas/user-entity-schema'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as mongoose from 'mongoose'

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  async findActiveByFb(fbId: string): Promise<UserEntity | null> {
    return this.userModel
      .findOne({ 'credential.fbId': fbId, active: true })
      .exec()
  }

  async findActiveByApple(appleEmail: string): Promise<UserEntity | null> {
    return this.userModel
      .findOne({ 'credential.appleEmail': appleEmail, active: true })
      .exec()
  }

  async findActiveByCredentialHash(hash: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ credentialHash: hash, active: true }).exec()
  }

  async findActiveByMongooseId(mid: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ _id: mid, active: true }).exec()
  }

  async findActiveByLocalId(id: string): Promise<UserEntity | null> {
    return this.userModel
      .findOne({ 'credential.localId': id, active: true })
      .exec()
  }

  update(user: UserEntity): Promise<void> {
    return this.userModel
      .findOne({ _id: user._id })
      .exec()
      .then((userDocument: any) => {
        userDocument.credential = user.credential
        userDocument.credentialHash = user.credentialHash
        userDocument.isAdmin = user.isAdmin
        userDocument.regDate = user.regDate
        userDocument.notificationCheckedAt = user.notificationCheckedAt
        userDocument.email = user.email
        userDocument.fcmKey = user.fcmKey
        userDocument.active = user.active
        userDocument.lastLoginTimestamp = user.lastLoginTimestamp
        userDocument.save()
      })
  }

  async insert(user: UserEntity): Promise<UserEntity | null> {
    const mongooseUserModel = new this.userModel(user)
    return mongooseUserModel.save()
  }

  async updateLastLoginTimestamp(user: UserEntity): Promise<void> {
    const timestamp = Date.now()
    // Mongoose를 사용하면 성능이 저하되므로, raw mongodb를 사용한다.
    await mongoose.connection.db
      .collection('users')
      .updateOne({ _id: user._id }, { $set: { lastLoginTimestamp: timestamp } })
      .catch((err) => {
        console.error('Failed to update timestamp')
        console.error(err)
      })
    user.lastLoginTimestamp = timestamp
    return
  }
}
