import assert = require('assert');
import rewire = require('rewire');

let notifiyRewire = rewire('@app/batch/coursebook/data/notify');

describe('notifyUnitTest', function() {
    it("getUpdatedLectureNotificationMessage__success", async function() {
        let timetableTitle = "나으 시간표";
        let timetable = {
            title: timetableTitle
        };
        let updated = {
            course_title: "그 강의",
            after: {
                instructor: "김교수님",
                credit: "3학점",
                class_time_json: {}
            }
        }
        let actual = notifiyRewire.__get__("getUpdatedLectureNotificationMessage")(timetable, updated);
        let expected = "'나으 시간표' 시간표의 '그 강의' 강의가 업데이트 되었습니다. (항목: 교수, 학점, 강의 시간/장소)";
        assert.deepEqual(actual, expected);
    });
});
