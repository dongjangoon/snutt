import { Injectable } from '@nestjs/common'
import { CoursebookRepository } from '@snutt-app/coursebook/coursebook.repository'
import { Coursebook } from '@snutt-app/coursebook/schema/coursebook.schema'

@Injectable()
export class CoursebookService {
  constructor(private readonly coursebookRepository: CoursebookRepository) {}

  async getAll(): Promise<Coursebook[]> {
    return this.coursebookRepository.findAll()
  }

  async getRecent(): Promise<Coursebook | null> {
    return this.coursebookRepository.findRecent()
  }

  async get(year: number, semester: number): Promise<Coursebook | null> {
    return this.coursebookRepository.findByYearAndSemester(year, semester)
  }

  async add(courseBook: Coursebook): Promise<void> {
    return this.coursebookRepository.insert(courseBook)
  }

  async modifyUpdatedAt(
    courseBook: Coursebook,
    updatedAt: Date,
  ): Promise<void> {
    courseBook.updated_at = updatedAt
    return this.coursebookRepository.update(courseBook)
  }
}
