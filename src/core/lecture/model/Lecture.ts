export default interface Lecture {
    classification: string,                           // 교과 구분
    department: string,                               // 학부
    academic_year: string,                            // 학년
    course_title: string,   // 과목명
    credit: number,                                   // 학점
    class_time: string,
    class_time_json: [
      { day : number, start: number, len: number, place : string }
    ],
    class_time_mask: number[],
    instructor: string,                               // 강사
    quota: number,                                    // 정원
    remark: string,                                   // 비고
    category: string,
}