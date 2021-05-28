import { Module } from '@nestjs/common'
import { CoursebookController } from './coursebook.controller'
import { MongooseModule } from '@nestjs/mongoose'
import {
  CoursebookEntity,
  CoursebookSchema,
} from '@snutt-app/coursebook/schema/coursebook.schema'
import { CoursebookService } from '@snutt-app/coursebook/coursebook.service'
import { CoursebookRepository } from '@snutt-app/coursebook/coursebook.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoursebookEntity.name, schema: CoursebookSchema },
    ]),
  ],
  controllers: [CoursebookController],
  providers: [CoursebookService, CoursebookRepository],
})
export class CoursebookModule {}
