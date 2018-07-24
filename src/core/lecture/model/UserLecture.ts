import Lecture from "./Lecture";
import LectureColor from './LectureColor';

export default interface UserLecture extends Lecture {
    _id?: string,
    created_at: Date,
    updated_at: Date,
    color?: LectureColor,
    colorIndex: number,
    course_number?: string,   // 교과목 번호
    lecture_number?: string,  // 강좌 번호
}
