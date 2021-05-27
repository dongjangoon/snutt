import { Body, Controller, Get, Post } from '@nestjs/common'
import { CatsService } from './cats.service'
import { Cat } from '@snutt-schema/cat.schema'
import { CatsDto } from '@snutt-app/cats/cats.dto'

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  getCat(): Promise<Cat> {
    return this.catsService.create({ name: 'asdf', age: 1, breed: 'asdf' })
  }

  @Post('/test')
  getTest(@Body() params: CatsDto) {
    return params.name.repeat(params.count)
  }
}
