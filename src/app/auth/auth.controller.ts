import { Body, Controller, Post } from '@nestjs/common'
import { UserService } from '@snutt-app/user/user.service'
import { LoginLocalDto, RegisterLocalDto } from '@snutt-app/auth/auth.dto'
import { WrongIdError, WrongPasswordError } from '@snutt-app/auth/auth.error'
import { AuthService } from '@snutt-app/auth/auth.service'
import { UserNotFoundError } from '@snutt-app/user/user.error'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('/login_local')
  async loginLocal(@Body() payload: LoginLocalDto) {
    const user = await this.userService.getByLocalId(payload.id)
    if (!user) {
      throw new WrongIdError()
    }
    const passwordMatch = await this.authService.isRightPassword(
      user,
      payload.password,
    )
    if (!passwordMatch) {
      throw new WrongPasswordError()
    }
    return { token: user.credentialHash, user_id: user._id }
  }

  @Post('/register_local')
  async registerLocal(@Body() payload: RegisterLocalDto) {
    const credential = await this.authService.makeLocalCredential(
      payload.id,
      payload.password,
    )
    const credentialHash = await this.authService.makeCredentialHmac(credential)
    const inserted = await this.userService.add({
      credential: credential,
      credentialHash: credentialHash,
      email: payload.email,
    })

    return {
      message: 'ok',
      token: inserted?.credentialHash,
      user_id: inserted?._id,
    }
  }

  @Post('/logout')
  async logout() {
    const payload = { user_id: 'asdf', registration_id: 'asdf' }
    const user = await this.userService.getByMongooseId(payload.user_id)
    if (!user) {
      throw new UserNotFoundError()
    }
    // Refactoring TODO
    //   await UserDeviceService.detachDevice(user, registrationId)
    return { message: 'ok' }
  }

  // restPost(
  //   router,
  //   '/login_apple',
  // )(async (context, req) => {
  //   if (!req.body.apple_token) {
  //     throw new ApiError(
  //       400,
  //       ErrorCode.NO_APPLE_ID_OR_TOKEN,
  //       'both apple_id and apple_token required',
  //     )
  //   }
  //
  //   try {
  //     const userInfo = await AppleService.verifyAndDecodeAppleToken(
  //       req.body.apple_token,
  //     )
  //     const user = await UserService.getByApple(userInfo.email)
  //     if (user) {
  //       return { token: user.credentialHash, user_id: user._id }
  //     } else {
  //       const credential: UserCredential =
  //         await UserCredentialService.makeAppleCredential(
  //           userInfo.email,
  //           userInfo.sub,
  //         )
  //       logger.info('Made apple credential: ' + JSON.stringify(credential))
  //       const credentialHash: string =
  //         await UserCredentialService.makeCredentialHmac(credential)
  //       const newUser: User = {
  //         credential: credential,
  //         credentialHash: credentialHash,
  //         email: userInfo.email,
  //       }
  //       logger.info('New user info: ' + JSON.stringify(newUser))
  //       const inserted: User = await UserService.add(newUser)
  //       logger.info('Inserted new user: ' + JSON.stringify(inserted))
  //       return { token: inserted.credentialHash, user_id: inserted._id }
  //     }
  //   } catch (err) {
  //     if (err instanceof InvalidAppleTokenError) {
  //       throw new ApiError(403, ErrorCode.WRONG_FB_TOKEN, 'wrong fb token')
  //     }
  //     throw err
  //   }
  // })
  //
  // restPost(
  //   router,
  //   '/login_fb',
  // )(async (context, req) => {
  //   if (!req.body.fb_token || !req.body.fb_id) {
  //     throw new ApiError(
  //       400,
  //       ErrorCode.NO_FB_ID_OR_TOKEN,
  //       'both fb_id and fb_token required',
  //     )
  //   }
  //
  //   try {
  //     const user = await UserService.getByFb(req.body.fb_id)
  //     if (user) {
  //       if (await UserCredentialService.isRightFbToken(user, req.body.fb_token)) {
  //         return { token: user.credentialHash, user_id: user._id }
  //       } else {
  //         throw new ApiError(403, ErrorCode.WRONG_FB_TOKEN, 'wrong fb token')
  //       }
  //     } else {
  //       const credential = await UserCredentialService.makeFbCredential(
  //         req.body.fb_id,
  //         req.body.fb_token,
  //       )
  //       logger.info('Made fb credential: ' + JSON.stringify(credential))
  //       const credentialHash = await UserCredentialService.makeCredentialHmac(
  //         credential,
  //       )
  //       const newUser: User = {
  //         credential: credential,
  //         credentialHash: credentialHash,
  //         email: req.body.email,
  //       }
  //       logger.info('New user info: ' + JSON.stringify(newUser))
  //       const inserted = await UserService.add(newUser)
  //       logger.info('Inserted new user: ' + JSON.stringify(inserted))
  //       return { token: inserted.credentialHash, user_id: inserted._id }
  //     }
  //   } catch (err) {
  //     if (err instanceof InvalidFbIdOrTokenError) {
  //       throw new ApiError(403, ErrorCode.WRONG_FB_TOKEN, 'wrong fb token')
  //     }
  //     throw err
  //   }
  // })
}
