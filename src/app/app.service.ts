import { CACHE_MANAGER, Get, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @Get()
  getHello(): Promise<string | undefined> {
    return this.cacheManager.get('asdf')
  }
}
