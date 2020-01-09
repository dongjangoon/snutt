export default class LectureTimeOverlapError extends Error {
    constructor() {
        super("Lecture time overlapped");
    }
}