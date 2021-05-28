import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  CoursebookEntity,
  CoursebookDocument,
} from '@snutt-app/coursebook/schema/coursebook.schema'
import {
  CoursebookInfoDto,
  CoursebookInfoWithIdDto,
} from '@snutt-app/coursebook/coursebook.dto'

@Injectable()
export class CoursebookRepository {
  constructor(
    @InjectModel(CoursebookEntity.name)
    private coursebookModel: Model<CoursebookDocument>,
  ) {}

  async findAll(): Promise<Array<CoursebookInfoWithIdDto>> {
    const docs: CoursebookDocument[] = await this.coursebookModel
      .find({}, '-_id year semester updated_at')
      .sort([
        ['year', -1],
        ['semester', -1],
      ])
      .exec()
    return docs.map((doc) => new CoursebookInfoWithIdDto(doc))
  }
  async findRecent(): Promise<CoursebookInfoWithIdDto | null> {
    const doc = await this.coursebookModel
      .findOne({}, '-_id year semester updated_at')
      .sort([
        ['year', -1],
        ['semester', -1],
      ])
      .exec()
    return doc ? new CoursebookInfoWithIdDto(doc) : null
  }

  async findByYearAndSemester(
    year: number,
    semester: number,
  ): Promise<CoursebookInfoWithIdDto | null> {
    const doc = await this.coursebookModel
      .findOne({ year: year, semester: semester })
      .exec()
    return doc ? new CoursebookInfoWithIdDto(doc) : null
  }

  async insert(courseBook: CoursebookInfoDto): Promise<void> {
    new this.coursebookModel({ ...courseBook, updated_at: new Date() }).save()
  }

  async update(courseBook: CoursebookInfoDto): Promise<void> {
    this.coursebookModel
      .updateOne(
        { year: courseBook.year, semester: courseBook.semester },
        { ...courseBook, updated_at: new Date() },
      )
      .exec()
  }
}
