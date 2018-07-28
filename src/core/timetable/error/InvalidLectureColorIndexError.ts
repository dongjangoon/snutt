import LectureColor from "../model/LectureColor";

export default class InvalidLectureColorIndexError extends Error {
    constructor(public lectureColorIndex: number) {
        super("Invalid Lecture Color Index: " + lectureColorIndex);
    }
}
