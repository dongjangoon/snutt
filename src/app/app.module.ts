import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongooseModule } from '@nestjs/mongoose'
import { CatsModule } from './cats/cats.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MorganMiddleware } from '../middleware/logger.middleware'

const redisStore = require('cache-manager-redis-store')

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_HOST'),
        dbName: configService.get<string>('MONGODB_DATABASE_NAME'),
        user: configService.get<string>('MONGODB_USERNAME'),
        pass: configService.get<string>('MONGODB_PASSWORD'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        uri: configService.get<string>('REDIS_HOST'),
      }),
      inject: [ConfigService],
    }),
    CatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MorganMiddleware).forRoutes('*')
  }
}
