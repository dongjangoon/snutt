export default class UserLectureNotFoundError extends Error {
    constructor() {
        super("User lecture not found");
    }
}