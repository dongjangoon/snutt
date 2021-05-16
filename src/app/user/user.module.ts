import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserEntity, UserEntitySchema } from '../../schemas/user-entity-schema'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserEntitySchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
