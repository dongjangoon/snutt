export default class CustomLectureResetError extends Error {
    constructor() {
        super("Tried to reset a custom lecture");
    }
}
