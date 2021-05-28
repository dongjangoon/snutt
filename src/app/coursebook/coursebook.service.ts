import { Injectable } from '@nestjs/common'
import { CoursebookRepository } from '@snutt-app/coursebook/coursebook.repository'
import {
  CoursebookInfoDto,
  CoursebookInfoWithIdDto,
} from '@snutt-app/coursebook/coursebook.dto'
import { CoursebookEntity } from '@snutt-app/coursebook/schema/coursebook.schema'
import { CoursebookNotFoundError } from '@snutt-app/coursebook/coursebook.error'

@Injectable()
export class CoursebookService {
  constructor(private readonly coursebookRepository: CoursebookRepository) {}

  async getAll(): Promise<CoursebookInfoWithIdDto[]> {
    return this.coursebookRepository.findAll()
  }

  async getRecent(): Promise<CoursebookInfoWithIdDto> {
    const coursebook = this.coursebookRepository.findRecent()
    if (coursebook) {
      throw new CoursebookNotFoundError()
    }
    return coursebook
  }

  async get(
    year: number,
    semester: number,
  ): Promise<CoursebookInfoWithIdDto | null> {
    const coursebook = this.coursebookRepository.findByYearAndSemester(
      year,
      semester,
    )
    if (coursebook) {
      throw new CoursebookNotFoundError()
    }
    return coursebook
  }

  async add(courseBook: CoursebookInfoDto): Promise<void> {
    return this.coursebookRepository.insert(courseBook)
  }

  async modifyUpdatedAt(
    courseBook: CoursebookEntity,
    updatedAt: Date,
  ): Promise<void> {
    courseBook.updated_at = updatedAt
    return this.coursebookRepository.update(courseBook)
  }
}
