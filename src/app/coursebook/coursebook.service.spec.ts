import { Test, TestingModule } from '@nestjs/testing'
import { CoursebookService } from './coursebook.service'

describe('CoursebookService', () => {
  let service: CoursebookService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoursebookService],
    }).compile()

    service = module.get<CoursebookService>(CoursebookService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
