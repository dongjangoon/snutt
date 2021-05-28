import { CoursebookDocument } from '@snutt-app/coursebook/schema/coursebook.schema'
import { IsMongoId, IsNumber } from 'class-validator'

export class CoursebookInfoDto {
  @IsNumber()
  year: number
  @IsNumber()
  semester: number
  constructor(coursebookDocument: CoursebookDocument) {
    this.year = coursebookDocument.year
    this.semester = coursebookDocument.semester
  }
}

export class CoursebookInfoWithIdDto {
  @IsMongoId()
  _id: string
  @IsNumber()
  year: number
  @IsNumber()
  semester: number
  constructor(coursebookDocument: CoursebookDocument) {
    this._id = coursebookDocument._id.toString()
    this.year = coursebookDocument.year
    this.semester = coursebookDocument.semester
  }
}
