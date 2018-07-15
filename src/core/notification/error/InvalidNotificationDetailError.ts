import NotificationTypeEnum from "../model/NotificationTypeEnum";

export default class InvalidNotificationDetailError extends Error {
    constructor(public notiType: NotificationTypeEnum, public notiDetail: any) {
        super("Invalid notification detail for type: type = " +
            NotificationTypeEnum + ", detail = " + notiDetail);
    }
}