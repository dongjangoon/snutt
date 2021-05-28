import { Controller, Get, Query } from '@nestjs/common'
import { CoursebookService } from '@snutt-app/coursebook/coursebook.service'
import { getSyllabusUrl } from '@snutt-app/coursebook/official-coursebook.util'
import { CoursebookInfoWithIdDto } from '@snutt-app/coursebook/dto/coursebook.dto'

@Controller('course_books')
export class CoursebookController {
  constructor(private readonly coursebookService: CoursebookService) {}
  @Get()
  async getCoursebooks(): Promise<CoursebookInfoWithIdDto[]> {
    return this.coursebookService.getAll()
  }

  @Get('recent')
  async getRecentCoursebook(): Promise<CoursebookInfoWithIdDto | null> {
    return this.coursebookService.getRecent()
  }

  @Get('official')
  async getOfficialCourseBooks(
    @Query('year') year: string,
    @Query('semester') semester: string,
    @Query('lecture_number') lectureNumber: string,
    @Query('course_number') courseNumber: string,
  ): Promise<{ url: string }> {
    return {
      url: getSyllabusUrl(year, Number(semester), lectureNumber, courseNumber),
    }
  }
}
