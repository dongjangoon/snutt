import { LectureDiff, LectureIdent, LectureIdentUpdated } from '@app/batch/coursebook/data/compare';
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import Timetable from '@app/core/timetable/model/Timetable';
import TimetableService = require('@app/core/timetable/TimetableService');
import TimetableLectureService = require('@app/core/timetable/TimetableLectureService');
import UserService = require('@app/core/user/UserService');
import NotificationService = require('@app/core/notification/NotificationService');
import ObjectUtil = require('@app/core/common/util/ObjectUtil');

import winston = require('winston');
import LectureTimeOverlapError from '@app/core/timetable/error/LectureTimeOverlapError';
let logger = winston.loggers.get('default');

export async function notifyUpdated(year:number, semesterIndex:number, diff:LectureDiff,
    fcm_enabled:boolean):Promise<void> {
  let userIdNumUpdatedMap: Map<string, number> = new Map();
  let userIdNumRemovedMap: Map<string, number> = new Map();

  function incrementUpdated(userId: any) {
    userId = (typeof userId == 'string') ? userId : String(userId); 
    let oldValue = userIdNumUpdatedMap.get(userId);
    if (oldValue) {
      userIdNumUpdatedMap.set(userId, oldValue + 1);
    } else {
      userIdNumUpdatedMap.set(userId, 1);
    }
  }

  function incrementRemoved(userId: any) {
    userId = (typeof userId == 'string') ? userId : String(userId); 
    let oldValue = userIdNumRemovedMap.get(userId);
    if (oldValue) {
      userIdNumRemovedMap.set(userId, oldValue + 1);
    } else {
      userIdNumRemovedMap.set(userId, 1);
    }
  }

  async function processUpdated(updated_lecture: LectureIdentUpdated) {
    let timetables = await TimetableService.getHavingLecture(
      year, semesterIndex, updated_lecture.course_number, updated_lecture.lecture_number);

    for (let i=0; i<timetables.length; i++) {
      let timetable = timetables[i];
      let noti_detail = {
        timetable_id : timetable._id,
        lecture : updated_lecture
      };

      let lectureId = TimetableLectureService.getUserLectureFromTimetableByCourseNumber(
          timetable, updated_lecture.course_number, updated_lecture.lecture_number)._id;

      try {
        let userLecture = ObjectUtil.deepCopy(updated_lecture.after);
        userLecture._id = lectureId;
        await TimetableLectureService.partialModifyUserLecture(timetable.user_id, timetable._id, userLecture);
        incrementUpdated(timetable.user_id);
        await NotificationService.add({
          user_id: timetable.user_id,
          message: getUpdatedLectureNotificationMessage(timetable, updated_lecture),
          type: NotificationTypeEnum.LECTURE_UPDATE,
          detail: noti_detail,
          created_at: new Date()
        });
      } catch (err) {
        if (err instanceof LectureTimeOverlapError) {
          await TimetableLectureService.removeLecture(timetable.user_id, timetable._id, lectureId);
          incrementRemoved(timetable.user_id);
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

  async function processRemoved(removed_lecture: LectureIdent) {
    let timetables = await TimetableService.getHavingLecture(
      year, semesterIndex, removed_lecture.course_number, removed_lecture.lecture_number);

    for (let i=0; i<timetables.length; i++) {
      let timetable = timetables[i];
      let noti_detail = {
        timetable_id : timetable._id,
        lecture : removed_lecture
      };

      let lectureId = TimetableLectureService.getUserLectureFromTimetableByCourseNumber(
        timetable, removed_lecture.course_number, removed_lecture.lecture_number)._id;

      await TimetableLectureService.removeLecture(timetable.user_id, timetable._id, lectureId);
      incrementRemoved(timetable.user_id);
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
      let users: Set<string> = new Set();

      for (let userId of userIdNumRemovedMap.keys()) {
        users.add(userId);
      }

      for (let userId of userIdNumUpdatedMap.keys()) {
        users.add(userId);
      }

      let index = 1;
      for (let userId of users) {
        logger.info((index++) + "th user fcm");
        let updated_num = userIdNumUpdatedMap.get(userId);
        let removed_num = userIdNumRemovedMap.get(userId);
        let msg;
        if (updated_num & removed_num) {
          msg = "수강편람이 업데이트되어 "+updated_num+"개 강의가 변경되고 "+removed_num+"개 강의가 삭제되었습니다.";
        } else if (updated_num) {
          msg = "수강편람이 업데이트되어 "+updated_num+"개 강의가 변경되었습니다.";
        } else if (removed_num) {
          msg = "수강편람이 업데이트되어 "+removed_num+"개 강의가 삭제되었습니다.";
        } else {
          logger.error("Both updated_num and removed_num is undefined");
          continue;
        }

        let user = await UserService.getByMongooseId(userId);

        if (!user) {
          logger.warn("user not found");
          continue;
        }

        if (!user.fcmKey) {
          logger.warn("user has no fcmKey");
          continue;
        }
        try {
          await NotificationService.sendFcmMsg(user, "수강편람 업데이트", msg, "batch/coursebook", "lecture updated");
        } catch (err) {
          logger.error("Failed to send update fcm: {}", err);
        }
      }
  }

  if (fcm_enabled) {
    await sendFcm();
  }
}

function getUpdatedLectureNotificationMessage(timetable: Timetable, updatedLecture: LectureIdentUpdated): string {
  return "'"+timetable.title+"' 시간표의 '"
      + updatedLecture.course_title+"' 강의가 업데이트 되었습니다. "
      + "(항목: " + getLectureIdentUpdatedDescription(updatedLecture) + ")";
}

function getLectureIdentUpdatedDescription(updatedLecture: LectureIdentUpdated): string {
  let updatedKeys = Object.keys(updatedLecture.after);
  let updatedKeyDescriptions = updatedKeys.map(getUpdatedKeyDescription);
  return updatedKeyDescriptions.join(", ");
}

function getUpdatedKeyDescription(updatedKey: string): string {
  switch (updatedKey) {
    case 'classification':
      return "교과 구분";
    case 'department':
      return "학부";
    case 'academic_year':
      return "학년";
    case 'course_title':
      return "강의명";
    case 'credit':
      return "학점";
    case 'instructor':
      return "교수";
    case 'quota':
      return "정원";
    case 'remark':
      return "비고";
    case 'category':
      return "교양 구분";
    case 'class_time_json':
      return "강의 시간/장소"
    default:
      logger.error("Unknown updated key description: " + updatedKey);
      return "기타";
  }
}
