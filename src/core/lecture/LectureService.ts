import Lecture from './model/Lecture';
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import InvalidLectureTimemaskError from './error/InvalidLectureTimemaskError';

export function setTimemask(lecture: Lecture): void {
    if (lecture.class_time_json) {
      if (!lecture.class_time_mask) {
        lecture.class_time_mask = TimePlaceUtil.timeJsonToMask(lecture.class_time_json, true);
      } else {
        var timemask = TimePlaceUtil.timeJsonToMask(lecture.class_time_json);
        for (var i=0; i<timemask.length; i++) {
          if (timemask[i] != lecture.class_time_mask[i])
            throw new InvalidLectureTimemaskError();
        }
      }
    } else if (lecture.class_time_mask) {
        throw new InvalidLectureTimemaskError();
    }
}