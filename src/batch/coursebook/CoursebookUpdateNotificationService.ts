import NotificationService = require('@app/core/notification/NotificationService');
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import UserService = require('@app/core/user/UserService');
import Timetable from '@app/core/timetable/model/Timetable';
import LectureDifference from './model/LectureDifference';
import winston = require('winston');
import RefLecture from '@app/core/lecture/model/RefLecture';
let logger = winston.loggers.get('default');

export async function addCoursebookUpdateNotification(year: number, semester: number, isFcmEnabled: boolean) {
  var semesterString = (['1', '여름', '2', '겨울'])[semester - 1];
  var notificationMessage = year + "년도 " + semesterString + "학기 수강편람이 추가되었습니다.";
  if (isFcmEnabled) {
    await NotificationService.sendGlobalFcmMsg("신규 수강편람", notificationMessage, "batch/coursebook", "new coursebook");
  }
  await NotificationService.add({
    user_id: null,
    message: notificationMessage,
    type: NotificationTypeEnum.COURSEBOOK,
    detail: null,
    created_at: new Date()
  });
  logger.info("Notification inserted");
}

export async function sendCoursebookUpdateFcmNotification(userId: string, numUpdated: number, numRemoved: number) {
  let msg;
  if (numUpdated & numRemoved) {
    msg = "수강편람이 업데이트되어 "+numUpdated+"개 강의가 변경되고 "+numRemoved+"개 강의가 삭제되었습니다.";
  } else if (numUpdated) {
    msg = "수강편람이 업데이트되어 "+numUpdated+"개 강의가 변경되었습니다.";
  } else if (numRemoved) {
    msg = "수강편람이 업데이트되어 "+numRemoved+"개 강의가 삭제되었습니다.";
  } else {
    logger.error("Both updated_num and removed_num is undefined");
    return;
  }

  let user = await UserService.getByMongooseId(userId);

  if (!user) {
    logger.warn("user not found");
    return;
  }

  if (!user.fcmKey) {
    logger.warn("user has no fcmKey");
    return;
  }
  try {
    await NotificationService.sendFcmMsg(user, "수강편람 업데이트", msg, "batch/coursebook", "lecture updated");
  } catch (err) {
    logger.error("Failed to send update fcm: {}", err);
  }
}

export async function addLectureRemovedNotification(timetable: Timetable, removed: RefLecture) {
  let noti_detail = {
    timetable_id : timetable._id,
    lecture : {
      course_number: removed.course_number,
      lecture_number: removed.lecture_number,
      course_title: removed.course_title
    }
  };
  await NotificationService.add({
    user_id: timetable.user_id,
    message: makeSemesterString(timetable.year, timetable.semester) + " '"+timetable.title+"' 시간표의 '"+removed.course_title+"' 강의가 폐강되어 삭제되었습니다.",
    type: NotificationTypeEnum.LECTURE_REMOVE,
    detail: noti_detail,
    created_at: new Date()
  });
}

export async function addLectureUpdateNotification(timetable: Timetable, lectureDifference: LectureDifference) {
  let detail = {
    timetable_id : timetable._id,
    lecture : {
      course_number: lectureDifference.oldLecture.course_number,
      lecture_number: lectureDifference.oldLecture.lecture_number,
      course_title: lectureDifference.oldLecture.course_title,
      after: lectureDifference.difference
    }
  };
  await NotificationService.add({
    user_id: timetable.user_id,
    message: getUpdatedLectureNotificationMessage(timetable, lectureDifference),
    type: NotificationTypeEnum.LECTURE_UPDATE,
    detail: detail,
    created_at: new Date()
  });
}

export async function addTimeOverlappedLectureRemovedNotification(timetable: Timetable, lectureDifference: LectureDifference) {
  let detail = {
    timetable_id : timetable._id,
    lecture : {
      course_number: lectureDifference.oldLecture.course_number,
      lecture_number: lectureDifference.oldLecture.lecture_number,
      course_title: lectureDifference.oldLecture.course_title,
      after: lectureDifference.difference
    }
  };
  await NotificationService.add({
    user_id: timetable.user_id,
    message: makeSemesterString(timetable.year, timetable.semester) + " '"+timetable.title+"' 시간표의 '"+lectureDifference.oldLecture.course_title+
      "' 강의가 업데이트되었으나, 시간표가 겹쳐 삭제되었습니다.",
    type: NotificationTypeEnum.LECTURE_REMOVE,
    detail: detail,
    created_at: new Date()
  });
}

function getUpdatedLectureNotificationMessage(timetable: Timetable, lectureDifference: LectureDifference): string {
  return makeSemesterString(timetable.year, timetable.semester) + " '"+timetable.title+"' 시간표의 '"
      + lectureDifference.oldLecture.course_title+"' 강의가 업데이트 되었습니다. "
      + "(항목: " + getLectureIdentUpdatedDescription(lectureDifference) + ")";
}

function makeSemesterString(year: number, semesterIndex: number) {
  var semesterString = (['1', 'S', '2', 'W'])[semesterIndex - 1];
  return year + "-" + semesterString;
}

function getLectureIdentUpdatedDescription(lectureDifference: LectureDifference): string {
  let updatedKeys = Object.keys(lectureDifference.difference);
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
