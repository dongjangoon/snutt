import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { SNUTTExceptionFilter } from './middleware/exception/exception.filter'
import { ValidationPipe } from '@nestjs/common'
import { ApiInvalidInputError } from '@snutt-middleware/exception/api-error'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (e) => {
        console.error(e)
        return new ApiInvalidInputError()
      },
    }),
  )
  app.useGlobalFilters(new SNUTTExceptionFilter())
  await app.listen(3000)
}

bootstrap()
