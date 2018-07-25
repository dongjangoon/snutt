import RefLectureRepository = require('./RefLectureRepository');
import RefLecture from './model/RefLecture';
import { findByYearAndSemester } from '../coursebook/CourseBookRepository';

export function query(query: any, limit: number, offset: number): Promise<RefLecture[]> {
    return RefLectureRepository.query(query, limit, offset);
}

export function getByMongooseId(mongooseId: string): Promise<RefLecture> {
    return RefLectureRepository.findByMongooseId(mongooseId);
}

export function getByCourseNumber(year: number, semester: number, courseNumber: string, lectureNumber: string): Promise<RefLecture> {
    return RefLectureRepository.findByCourseNumber(year, semester, courseNumber, lectureNumber);
}
