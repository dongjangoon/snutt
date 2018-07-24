import RefLectureRepository = require('./RefLectureRepository');
import RefLecture from './model/RefLecture';

export async function query(query: any, limit: number, offset: number): Promise<RefLecture[]> {
    return RefLectureRepository.query(query, limit, offset);
}

export async function getByMongooseId(mongooseId: string): Promise<RefLecture> {
    return RefLectureRepository.findByMongooseId(mongooseId);
}
