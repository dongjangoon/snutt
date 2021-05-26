import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  Coursebook,
  CoursebookDocument,
} from '@snutt-app/coursebook/schema/coursebook.schema'

@Injectable()
export class CoursebookRepository {
  constructor(
    @InjectModel(Coursebook.name)
    private coursebookModel: Model<CoursebookDocument>,
  ) {}

  async findAll(): Promise<Array<Coursebook>> {
    return this.coursebookModel
      .find({}, '-_id year semester updated_at')
      .sort([
        ['year', -1],
        ['semester', -1],
      ])
      .exec()
  }
  async findRecent(): Promise<Coursebook | null> {
    return this.coursebookModel
      .findOne({}, '-_id year semester updated_at')
      .sort([
        ['year', -1],
        ['semester', -1],
      ])
      .exec()
  }

  async findByYearAndSemester(
    year: number,
    semester: number,
  ): Promise<Coursebook | null> {
    return this.coursebookModel
      .findOne({ year: year, semester: semester })
      .exec()
  }

  async insert(courseBook: Coursebook): Promise<void> {
    new this.coursebookModel(courseBook).save()
  }

  async update(courseBook: Coursebook): Promise<void> {
    this.coursebookModel
      .updateOne(
        { year: courseBook.year, semester: courseBook.semester },
        courseBook,
      )
      .exec()
  }
}
