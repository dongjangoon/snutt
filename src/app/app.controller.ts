import { CACHE_MANAGER, Controller, Get, Inject } from '@nestjs/common'
import { AppService } from './app.service'
import { Cache } from 'cache-manager'

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
}
