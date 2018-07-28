import LectureColor from "../model/LectureColor";

export default class InvalidLectureColorError extends Error {
    constructor(public lectureColor: LectureColor) {
        super("Invalid Lecture Color: " + lectureColor);
    }
}
