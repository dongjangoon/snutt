import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  NestMiddleware,
} from '@nestjs/common'
import { Response, Request, NextFunction } from 'express'
import { WrongUserTokenError } from './user-auth.error'
import { UserService } from '../../app/user/user.service'

@Injectable()
export class UserAuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(
    req: Request & { user: any },
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    const token = req.header('x-access-token')
    if (!token) {
      next()
      return
    }

    const user = await this.userService.getByCredentialHash(token)

    if (!user) {
      throw new WrongUserTokenError()
    }

    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
    await this.userService.updateLastLoginTimestamp(user)
    req.user = user
    next()
  }
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
