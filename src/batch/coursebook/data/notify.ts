import { LectureDiff } from '@app/batch/coursebook/data/compare';
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import { TimetableModel } from '@app/core/model/timetable';
import errcode = require('@app/api/errcode');
import UserService = require('@app/core/user/UserService');
import NotificationService = require('@app/core/notification/NotificationService');

import log4js = require('log4js');
var logger = log4js.getLogger();

export async function notifyUpdated(year:number, semesterIndex:number, diff:LectureDiff,
    fcm_enabled:boolean):Promise<void> {
  var num_updated_per_user: {[key: string]: number} = {}
  var num_removed_per_user: {[key: string]: number} = {}

  async function processUpdated(updated_lecture) {
    let timetables = await TimetableModel.getWithLecture(
      year, semesterIndex, updated_lecture.course_number, updated_lecture.lecture_number);

    for (let i=0; i<timetables.length; i++) {
      let timetable = timetables[i];
      var noti_detail = {
        timetable_id : timetable._id,
        lecture : updated_lecture
      };

      let lectureId = timetable.findLectureId(updated_lecture.course_number, updated_lecture.lecture_number);

      try {
        await timetable.updateLecture(lectureId, updated_lecture.after);
        if (num_updated_per_user[timetable.userId]) num_updated_per_user[timetable.userId]++;
        else num_updated_per_user[timetable.userId] = 1;
        await NotificationService.add({
          user_id: timetable.userId,
          message: "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+"' 강의가 업데이트 되었습니다.",
          type: NotificationTypeEnum.LECTURE_UPDATE,
          detail: noti_detail,
          created_at: new Date()
        });
      } catch (err) {
        if (err == errcode.LECTURE_TIME_OVERLAP) {
          await timetable.deleteLecture(lectureId);
          if (num_removed_per_user[timetable.userId]) num_removed_per_user[timetable.userId]++;
          else num_removed_per_user[timetable.userId] = 1; 
          await NotificationService.add({
            user_id: timetable.userId,
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
    let timetables = await TimetableModel.getWithLecture(
      year, semesterIndex, removed_lecture.course_number, removed_lecture.lecture_number);

    for (let i=0; i<timetables.length; i++) {
      let timetable = timetables[i];
      var noti_detail = {
        timetable_id : timetable._id,
        lecture : removed_lecture
      };

      let lectureId = timetable.findLectureId(removed_lecture.course_number, removed_lecture.lecture_number);
      
      await timetable.deleteLecture(lectureId);
      if (num_removed_per_user[timetable.userId]) num_removed_per_user[timetable.userId]++;
      else num_removed_per_user[timetable.userId] = 1; 
      await NotificationService.add({
        user_id: timetable.userId,
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
