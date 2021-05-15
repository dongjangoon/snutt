import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  NestMiddleware,
} from '@nestjs/common'
import { Response, Request, NextFunction } from 'express'
import { WrongUserTokenError } from './user-auth.error'

@Injectable()
export class UserAuthMiddleware implements NestMiddleware {
  use(req: Request & { user: any }, res: Response, next: NextFunction): any {
    const token = req.header('x-access-token')
    if (!token) {
      next()
      return
    }

    // let user = await UserService.getByCredentialHash(token);
    const user = {}

    if (!user) {
      throw new WrongUserTokenError()
    }

    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
    // UserService.updateLastLoginTimestamp(user)
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
