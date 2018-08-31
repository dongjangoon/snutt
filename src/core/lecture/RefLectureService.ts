import RefLectureRepository = require('./RefLectureRepository');
import RefLecture from './model/RefLecture';

export function query(query: any, limit: number, offset: number): Promise<RefLecture[]> {
    return RefLectureRepository.query(query, limit, offset);
}

export function queryAll(query: any): Promise<RefLecture[]> {
    return RefLectureRepository.queryAll(query);
}

export function getByMongooseId(mongooseId: string): Promise<RefLecture> {
    return RefLectureRepository.findByMongooseId(mongooseId);
}

export function getByCourseNumber(year: number, semester: number, courseNumber: string, lectureNumber: string): Promise<RefLecture> {
    return RefLectureRepository.findByCourseNumber(year, semester, courseNumber, lectureNumber);
}

export function getBySemester(year: number, semester: number): Promise<RefLecture[]> {
    return RefLectureRepository.findBySemester(year, semester);
}

export function addAll(lectures: RefLecture[]): Promise<number> {
    return RefLectureRepository.insertAll(lectures);
}

export function removeBySemester(year: number, semester: number): Promise<void> {
    return RefLectureRepository.deleteBySemester(year, semester);
}
