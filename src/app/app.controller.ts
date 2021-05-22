import {
  CACHE_MANAGER,
  Controller,
  Get,
  Inject,
  UseGuards,
} from '@nestjs/common'
import { AppService } from './app.service'
import { Cache } from 'cache-manager'
import ErrorCode from '../middleware/exception/error-code'
import { ApiError } from '../middleware/exception/api-error'
import { UserAuthGuard } from '../middleware/auth/user-auth-guard'
import { User } from '../middleware/auth/user-auth.middleware'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async getHello(): Promise<string | undefined> {
    const result: string = (await this.cacheManager.get('asdf')) ?? ''
    await this.cacheManager.set('asdf', result + '!')
    return this.cacheManager.get('asdf')
  }

  @Get('error')
  getError(): string {
    throw new ApiError(401, ErrorCode.ALREADY_FB_ACCOUNT, 'asdf')
  }

  @UseGuards(UserAuthGuard)
  @Get('user')
  getUser(@User() user: any): string {
    return user.toString()
  }
}
