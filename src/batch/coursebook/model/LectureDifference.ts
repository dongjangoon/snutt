import RefLecture from "@app/core/lecture/model/RefLecture";

export default interface LectureDifference {
    oldLecture: RefLecture,
    newLecture: RefLecture,
    difference: any
}
