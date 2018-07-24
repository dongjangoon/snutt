export default class DuplicateLectureError extends Error {
    constructor() {
        super("Duplicate lecture error");
    }
}