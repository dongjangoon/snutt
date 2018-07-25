import UserLecture from "@app/core/lecture/model/UserLecture";

export default class InvalidLectureUpdateRequestError extends Error {
    constructor(public lecture: UserLecture) {
        super("Invalid lecture update request '" + lecture + "'");
    }
}
