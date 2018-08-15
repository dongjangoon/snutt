import Lecture from "./Lecture";

export default interface RefLecture extends Lecture {
    year: number,           // 연도
    semester: number,       // 학기
    course_number: string,   // 교과목 번호
    lecture_number: string,  // 강좌 번호
}
