import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { SNUTTExceptionFilter } from './middleware/exception/exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalFilters(new SNUTTExceptionFilter())
  await app.listen(3000)
}

bootstrap()
