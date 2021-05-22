import bcrypt from 'bcrypt'
import CryptoJs from 'crypto-js'
import { Injectable } from '@nestjs/common'
import { IUserCredential, UserEntity } from '@snutt-schema/user-entity-schema'
import { UserService } from '../user/user.service'
import {
  DuplicateLocalIdError,
  InvalidLocalIdError,
  InvalidLocalPasswordError,
} from './auth.error'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  secretKey: string

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey =
      this.configService.get<string>('SNUTT_SECRET_API_KEY') ?? ''
  }

  async isRightPassword(user: UserEntity, password: string): Promise<boolean> {
    const originalHash = user.credential.localPw
    if (!password || !originalHash) {
      return false
    }

    return bcrypt.compare(password, originalHash)
  }

  compareCredentialHash(user: UserEntity, hash: string): boolean {
    return user.credentialHash === hash
  }

  makeCredentialHmac(userCredential: IUserCredential): string {
    // Refactoring: need check
    // 라이브러리 바꿈
    return CryptoJs.HmacSHA256(
      JSON.stringify(userCredential),
      this.secretKey,
    ).toString(CryptoJS.enc.Hex)
  }

  async modifyCredential(user: UserEntity): Promise<void> {
    user.credentialHash = this.makeCredentialHmac(user.credential)
    await this.userService.modify(user)
  }

  validatePassword(password: string): void {
    if (!password || !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i)) {
      throw new InvalidLocalPasswordError()
    }
  }

  makePasswordHash(password: string): Promise<string> {
    return bcrypt.hash(password, 4)
  }

  async changeLocalPassword(user: UserEntity, password: string): Promise<void> {
    this.validatePassword(password)
    user.credential.localPw = await this.makePasswordHash(password)
    await this.modifyCredential(user)
  }

  hasFb(user: UserEntity): boolean {
    return user.credential.fbId !== null && user.credential.fbId !== undefined
  }

  hasLocal(user: UserEntity): boolean {
    return (
      user.credential.localId !== null && user.credential.localId !== undefined
    )
  }

  validateLocalId(id: string): void {
    if (!id || !id.match(/^[a-z0-9]{4,32}$/i)) {
      throw new InvalidLocalIdError()
    }
  }

  async attachLocal(
    user: UserEntity,
    id: string,
    password: string,
  ): Promise<void> {
    const localCredential = await this.makeLocalCredential(id, password)

    user.credential.localId = localCredential.localId
    user.credential.localPw = localCredential.localPw
    await this.modifyCredential(user)
  }

  async makeLocalCredential(
    id: string,
    password: string,
  ): Promise<{ localId: string; localPw: string }> {
    this.validateLocalId(id)
    this.validatePassword(password)

    if (await this.userService.getByLocalId(id)) {
      throw new DuplicateLocalIdError()
    }

    const passwordHash = await this.makePasswordHash(password)

    return {
      localId: id,
      localPw: passwordHash,
    }
  }

  //
  // export async function makeAppleCredential(appleEmail: string, appleSub: string): Promise<UserCredential> {
  //   if (await UserService.getByApple(appleEmail)) {
  //     throw new AlreadyRegisteredAppleEmailError(appleEmail);
  //   }
  //   return {
  //     appleEmail: appleEmail,
  //     appleSub: appleSub
  //   }
  // }
  //
  // export async function attachFb(user: User, fbId: string, fbToken: string): Promise<void> {
  //   if (!fbId) {
  //     throw new InvalidFbIdOrTokenError(fbId, fbToken);
  //   }
  //
  //   let fbCredential = await makeFbCredential(fbId, fbToken);
  //   user.credential.fbName = fbCredential.fbName;
  //   user.credential.fbId = fbCredential.fbId;
  //   await modifyCredential(user);
  // }
  //
  // export async function detachFb(user: User): Promise<void> {
  //   if (!hasLocal(user)) {
  //     return Promise.reject(new NotLocalAccountError(user._id));
  //   }
  //   user.credential.fbName = null;
  //   user.credential.fbId = null;
  //   await modifyCredential(user);
  // }
  //
  // export async function makeFbCredential(fbId: string, fbToken: string): Promise<UserCredential> {
  //   if (await UserService.getByFb(fbId)) {
  //     throw new AlreadyRegisteredFbIdError(fbId);
  //   }
  //   logger.info("Trying to get fb info: fbId - " + fbId + " / fbToken - " + fbToken);
  //   let fbInfo = await FacebookService.getFbInfo(fbId, fbToken);
  //   logger.info("Got fb info: " + JSON.stringify(fbInfo));
  //   return {
  //     fbId: fbInfo.fbId,
  //     fbName: fbInfo.fbName
  //   }
  // }
  //
  // isRightFbToken(user: UserEntity, fbToken: string): Promise<boolean> {
  //   try {
  //     const fbInfo = await FacebookService.getFbInfo(
  //       user.credential.fbId,
  //       fbToken,
  //     )
  //     return fbInfo.fbId === user.credential.fbId
  //   } catch (err) {
  //     return false
  //   }
  // }
  //
  // export async function attachTemp(user: User): Promise<void> {
  //   let tempCredential = await makeTempCredential();
  //   user.credential.tempDate = tempCredential.tempDate;
  //   user.credential.tempSeed = tempCredential.tempSeed;
  //   await modifyCredential(user);
  // }
  //
  // export async function makeTempCredential(): Promise<UserCredential> {
  //   return {
  //     tempDate: new Date(),
  //     tempSeed: Math.floor(Math.random() * 1000)
  //   }
  // }
}
