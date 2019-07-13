import assert = require('assert');
import rewire = require('rewire');

let CoursebookUpdateNotificationServiceRewire = rewire('@app/batch/coursebook/CoursebookUpdateNotificationService');

describe('notifyUnitTest', function() {
    it("getUpdatedLectureNotificationMessage__success", async function() {
        let timetableTitle = "나으 시간표";
        let timetable = {
            year: 2019,
            semester: 2,
            title: timetableTitle
        };
        let difference = {
            oldLecture: {
                course_title: "그 강의"
            },
            difference: {
                instructor: "김교수님",
                credit: "3학점",
                class_time_json: {}
            }
        }
        let actual = CoursebookUpdateNotificationServiceRewire.__get__("getUpdatedLectureNotificationMessage")(timetable, difference);
        let expected = "2019-S '나으 시간표' 시간표의 '그 강의' 강의가 업데이트 되었습니다. (항목: 교수, 학점, 강의 시간/장소)";
        assert.deepEqual(actual, expected);
    });
});
