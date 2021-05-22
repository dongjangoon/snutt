import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { NoUserTokenError } from './user-auth.error'

@Injectable()
export class UserAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    if (!request.user) {
      throw new NoUserTokenError()
    }

    return true
  }
}
