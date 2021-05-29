import { Injectable } from '@nestjs/common'
import { UserRepository } from './user.repository'
import { IUserCredential, UserEntity } from '@snutt-schema/user-entity-schema'
import { UserNotFoundError } from './user.error'
import { UserInfoDto } from './user.dto'

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getByMongooseId(mongooseId: string): Promise<UserEntity> {
    const result = await this.userRepository.findActiveByMongooseId(mongooseId)
    if (!result) {
      throw new UserNotFoundError()
    }
    return result
  }

  async getByLocalId(localId: string): Promise<UserEntity> {
    const result = await this.userRepository.findActiveByLocalId(localId)
    if (!result) {
      throw new UserNotFoundError()
    }
    return result
  }

  async getByFb(fbId: string): Promise<UserEntity> {
    const result = await this.userRepository.findActiveByFb(fbId)
    if (!result) {
      throw new UserNotFoundError()
    }
    return result
  }

  async getByApple(appleEmail: string): Promise<UserEntity> {
    const result = await this.userRepository.findActiveByApple(appleEmail)
    if (!result) {
      throw new UserNotFoundError()
    }
    return result
  }

  async getByCredentialHash(credentialHash: string): Promise<UserEntity> {
    const result = await this.userRepository.findActiveByCredentialHash(
      credentialHash,
    )
    if (!result) {
      throw new UserNotFoundError()
    }
    return result
  }

  async modify(user: UserEntity): Promise<void> {
    return this.userRepository.update(user)
  }

  async updateNotificationCheckDate(user: UserEntity): Promise<void> {
    user.notificationCheckedAt = new Date()
    return this.userRepository.update(user)
  }

  getUserInfo(user: UserEntity): UserInfoDto {
    return {
      isAdmin: user.isAdmin,
      regDate: user.regDate,
      notificationCheckedAt: user.notificationCheckedAt,
      email: user.email,
      local_id: user.credential.localId,
      fb_name: user.credential.fbName,
    }
  }

  async deactivate(user: UserEntity): Promise<void> {
    user.active = false
    return this.userRepository.update(user)
  }

  async setUserInfo(user: UserEntity, email: string): Promise<void> {
    user.email = email
    return this.userRepository.update(user)
  }

  async updateLastLoginTimestamp(user: UserEntity): Promise<void> {
    return this.userRepository.updateLastLoginTimestamp(user)
  }

  async add(user: {
    credential: IUserCredential
    credentialHash: string
    email?: string
  }): Promise<UserEntity | null> {
    const inserted = this.userRepository.insertCredentialUser(user)
    // await createDefaultTimetable(inserted)
    return inserted
  }

  // Refactoring: need check
  // timetable 추가 후에 더하기
  // async createDefaultTimetable(user: UserEntity): Promise<Timetable> {
  //   let userId = user._id;
  //   let coursebook = await CourseBookService.getRecent();
  //   return await TimetableService.addFromParam({
  //     user_id: userId,
  //     year: coursebook.year,
  //     semester: coursebook.semester,
  //     title: "나의 시간표"
  //   });
  // }
  //
}
