import { LectureDiff } from './compare';
import errcode = require('../../../lib/errcode');
import { Type as NotificationType, NotificationModel } from '../../../model/notification';
import { TimetableModel, TimetableDocument } from '../../../model/timetable';
import fcm = require('../../../lib/fcm');

function findTableWithLecture(year:number, semesterIndex:number, course_number:string,
  lecture_number:string, cb?:(err, timetables:TimetableDocument[])=>any): Promise<TimetableDocument[]> {
  return TimetableModel.find(
      {
        year: year,
        semester: semesterIndex,
        lecture_list: {
          $elemMatch : {
            course_number: course_number,
            lecture_number: lecture_number
          }
        }
      },
      {
        user_id : 1,
        title: 1,
        lecture_list: {
          $elemMatch : {
            course_number: course_number,
            lecture_number: lecture_number
          }
        }
  }, cb).exec();
}

export async function notifyUpdated(year:number, semesterIndex:number, diff:LectureDiff,
    fcm_enabled:boolean):Promise<void> {
  var num_updated_per_user: {[key: string]: number} = {}
  var num_removed_per_user: {[key: string]: number} = {}

  var promise = new Promise<void>(function(resolve, reject) {
    async.series([
      function (callback) {
        async.each(diff.updated, async function(updated_lecture, callback) {
          let timetables = await findTableWithLecture(
            year, semesterIndex, updated_lecture.course_number, updated_lecture.lecture_number);
          async.each(timetables, async function(timetable, callback) {
            if (timetable.lecture_list.length != 1) {
              return callback({
                message: "Lecture update error",
                timetable_id: timetable,
                lecture: updated_lecture
              });
            }
            var noti_detail = {
              timetable_id : timetable._id,
              lecture : updated_lecture
            };

            try {
              await timetable.update_lecture(timetable.lecture_list[0]._id, updated_lecture.after);
              if (num_updated_per_user[timetable.user_id]) num_updated_per_user[timetable.user_id]++;
              else num_updated_per_user[timetable.user_id] = 1;
              await NotificationModel.createNotification(
                timetable.user_id,
                "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+"' 강의가 업데이트 되었습니다.",
                NotificationType.LECTURE_UPDATE,
                noti_detail,
                "unused");
            } catch (err) {
              if (err == errcode.LECTURE_TIME_OVERLAP) {
                await timetable.delete_lecture(timetable.lecture_list[0]._id);
                if (num_removed_per_user[timetable.user_id]) num_removed_per_user[timetable.user_id]++;
                else num_removed_per_user[timetable.user_id] = 1; 
                await NotificationModel.createNotification(
                  timetable.user_id,
                  "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+
                    "' 강의가 업데이트되었으나, 시간표가 겹쳐 삭제되었습니다.",
                  NotificationType.LECTURE_REMOVE,
                  noti_detail,
                  "unused");
              } else throw err;
            }
            callback();
          }, function(err) {
            callback(err);
          });
        }, function(err){
          callback(err);
        });
      },

      function (callback) {
        async.each(diff.removed, async function(removed_lecture, callback) {
          let timetables = await findTableWithLecture(
            year, semesterIndex, removed_lecture.course_number, removed_lecture.lecture_number);
          
          async.each(timetables, async function(timetable, callback) {
            if (timetable.lecture_list.length != 1) {
              return callback({
                message: "Lecture update error",
                timetable_id: timetable,
                lecture: removed_lecture
              });
            }
            var noti_detail = {
              timetable_id : timetable._id,
              lecture : removed_lecture
            };
            
            await timetable.delete_lecture(timetable.lecture_list[0]._id);
            if (num_removed_per_user[timetable.user_id]) num_removed_per_user[timetable.user_id]++;
            else num_removed_per_user[timetable.user_id] = 1; 
            await NotificationModel.createNotification(
              timetable.user_id,
              "'"+timetable.title+"' 시간표의 '"+removed_lecture.course_title+"' 강의가 폐강되어 삭제되었습니다.",
              NotificationType.LECTURE_REMOVE,
              noti_detail,
              "unused");
            callback();
          }, function(err) {
            callback(err);
          });
        }, function(err){
          callback(err);
        });
      }
      
    ], function(err) {
      if(fcm_enabled) {
        var users = [];
        for (var user_id in Object.keys(num_updated_per_user)) {
          users.push(user_id);
        }

        for (var user_id in Object.keys(num_removed_per_user)) {
          if (user_id in num_updated_per_user) continue;
          users.push(user_id);
        }

        for (var i=0; i<users.length; i++) {
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
          /* It takes too long to await each requests */
          fcm.send_msg(users[i], msg, "update_lectures.ts", "lecture updated");
        }
      }
      if (err) return reject(err);
      return resolve();
    });
  });
  return promise;
}
