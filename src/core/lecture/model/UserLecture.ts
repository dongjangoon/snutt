import Lecture from "./Lecture";

export default interface UserLecture extends Lecture {
    created_at: Date,
    updated_at: Date,
    color: {fg : string, bg : string},
    colorIndex: number,
    course_number?: string,   // 교과목 번호
    lecture_number?: string,  // 강좌 번호
}
