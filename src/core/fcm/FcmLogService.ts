import FcmLog from '@app/core/fcm/model/FcmLog';
import FcmLogRepository = require('@app/core/fcm/FcmLogRepository');

export function addFcmLog(to: string, author: string, message: string, cause: string, response: string): Promise<void> {
    let fcmLog: FcmLog = {
        date: new Date(),
        to: to,
        author: author,
        message: message,
        cause: cause,
        response: response
    }
    return FcmLogRepository.insertFcmLog(fcmLog);
}

export function getRecentFcmLog(): Promise<FcmLog[]>{
  return FcmLogRepository.findRecentFcmLog();
}