import { Controller, Get } from '@nestjs/common'
import { CatsService } from './cats.service'
import { Cat } from '@snutt-schema/cat.schema'

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  getCat(): Promise<Cat> {
    return this.catsService.create({ name: 'asdf', age: 1, breed: 'asdf' })
  }
}
