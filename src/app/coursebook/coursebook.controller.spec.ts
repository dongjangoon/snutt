import { Test, TestingModule } from '@nestjs/testing'
import { CoursebookController } from './coursebook.controller'

describe('CoursebookController', () => {
  let controller: CoursebookController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursebookController],
    }).compile()

    controller = module.get<CoursebookController>(CoursebookController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
