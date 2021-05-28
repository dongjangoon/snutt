import { CoursebookDocument } from '@snutt-app/coursebook/schema/coursebook.schema'

export class CoursebookInfoDto {
  year: number
  semester: number
  constructor(coursebookDocument: CoursebookDocument) {
    this.year = coursebookDocument.year
    this.semester = coursebookDocument.semester
  }
}

export class CoursebookInfoWithIdDto {
  _id: string
  year: number
  semester: number
  constructor(coursebookDocument: CoursebookDocument) {
    this._id = coursebookDocument._id
    this.year = coursebookDocument.year
    this.semester = coursebookDocument.semester
  }
}
