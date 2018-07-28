import { LectureDiff } from '@app/batch/coursebook/data/compare';
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import TimetableService = require('@app/core/timetable/TimetableService');
import TimetableLectureService = require('@app/core/timetable/TimetableLectureService');
import UserService = require('@app/core/user/UserService');
import NotificationService = require('@app/core/notification/NotificationService');
import ObjectUtil = require('@app/core/common/util/ObjectUtil');

import log4js = require('log4js');
import LectureTimeOverlapError from '@app/core/timetable/error/LectureTimeOverlapError';
var logger = log4js.getLogger();

export async function notifyUpdated(year:number, semesterIndex:number, diff:LectureDiff,
    fcm_enabled:boolean):Promise<void> {
  var num_updated_per_user: {[key: string]: number} = {}
  var num_removed_per_user: {[key: string]: number} = {}

  async function processUpdated(updated_lecture) {
    let timetables = await TimetableService.getHavingLecture(
      year, semesterIndex, updated_lecture.course_number, updated_lecture.lecture_number);

    for (let i=0; i<timetables.length; i++) {
      let timetable = timetables[i];
      var noti_detail = {
        timetable_id : timetable._id,
        lecture : updated_lecture
      };

      let lectureId = TimetableLectureService.getUserLectureFromTimetableByCourseNumber(
          timetable, updated_lecture.course_number, updated_lecture.lecture_number)._id;

      try {
        let userLecture = ObjectUtil.deepCopy(updated_lecture.after);
        userLecture._id = lectureId;
        await TimetableLectureService.partialModifyUserLecture(timetable.user_id, timetable._id, userLecture);
        if (num_updated_per_user[timetable.user_id]) num_updated_per_user[timetable.user_id]++;
        else num_updated_per_user[timetable.user_id] = 1;
        await NotificationService.add({
          user_id: timetable.user_id,
          message: "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+"' 강의가 업데이트 되었습니다.",
          type: NotificationTypeEnum.LECTURE_UPDATE,
          detail: noti_detail,
          created_at: new Date()
        });
      } catch (err) {
        if (err instanceof LectureTimeOverlapError) {
          await TimetableLectureService.removeLecture(timetable.user_id, timetable._id, lectureId);
          if (num_removed_per_user[timetable.user_id]) num_removed_per_user[timetable.user_id]++;
          else num_removed_per_user[timetable.user_id] = 1; 
          await NotificationService.add({
            user_id: timetable.user_id,
            message: "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+
              "' 강의가 업데이트되었으나, 시간표가 겹쳐 삭제되었습니다.",
            type: NotificationTypeEnum.LECTURE_REMOVE,
            detail: noti_detail,
            created_at: new Date()
          });
        } else throw err;
      }
    }
  }

  for (let i=0; i<diff.updated.length; i++) {
    logger.info(i + "th updated");
    await processUpdated(diff.updated[i]);
  }

  async function processRemoved(removed_lecture) {
    let timetables = await TimetableService.getHavingLecture(
      year, semesterIndex, removed_lecture.course_number, removed_lecture.lecture_number);

    for (let i=0; i<timetables.length; i++) {
      let timetable = timetables[i];
      var noti_detail = {
        timetable_id : timetable._id,
        lecture : removed_lecture
      };

      let lectureId = TimetableLectureService.getUserLectureFromTimetableByCourseNumber(
        timetable, removed_lecture.course_number, removed_lecture.lecture_number)._id;

      await TimetableLectureService.removeLecture(timetable.user_id, timetable._id, lectureId);
      if (num_removed_per_user[timetable.user_id]) num_removed_per_user[timetable.user_id]++;
      else num_removed_per_user[timetable.user_id] = 1; 
      await NotificationService.add({
        user_id: timetable.user_id,
        message: "'"+timetable.title+"' 시간표의 '"+removed_lecture.course_title+"' 강의가 폐강되어 삭제되었습니다.",
        type: NotificationTypeEnum.LECTURE_REMOVE,
        detail: noti_detail,
        created_at: new Date()
      });
    }
  }

  for (let i=0; i<diff.removed.length; i++) {
    logger.info(i + "th removed");
    await processRemoved(diff.removed[i]);
  }

  async function sendFcm() {
      var users = [];
      for (var user_id in Object.keys(num_updated_per_user)) {
        users.push(user_id);
      }

      for (var user_id in Object.keys(num_removed_per_user)) {
        if (user_id in Object.keys(num_updated_per_user)) continue;
        users.push(user_id);
      }

      for (var i=0; i<users.length; i++) {
        logger.info(i + "th user fcm");
        var updated_num = num_updated_per_user[user_id];
        var removed_num = num_removed_per_user[user_id];
        var msg;
        if (updated_num & removed_num)
          msg = "수강편람이 업데이트되어 "+updated_num+"개 강의가 변경되고 "+removed_num+"개 강의가 삭제되었습니다.";
        else if (updated_num)
          msg = "수강편람이 업데이트되어 "+updated_num+"개 강의가 변경되었습니다.";
        else if (removed_num)
          msg = "수강편람이 업데이트되어 "+removed_num+"개 강의가 삭제되었습니다.";
        else
          continue;

        let user = await UserService.getByMongooseId(users[i]);

        if (user && user.fcmKey) {
          await NotificationService.sendFcmMsg(user, "수강편람 업데이트", msg, "batch/coursebook", "lecture updated");
        }
      }
  }

  if (fcm_enabled) {
    await sendFcm();
  }
}
