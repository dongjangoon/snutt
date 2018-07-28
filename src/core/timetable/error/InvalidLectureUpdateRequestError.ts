import UserLecture from "../model/UserLecture";

export default class InvalidLectureUpdateRequestError extends Error {
    constructor(public lecture: UserLecture) {
        super("Invalid lecture update request '" + lecture + "'");
    }
}
