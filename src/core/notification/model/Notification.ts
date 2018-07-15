import NotificationTypeEnum from "./NotificationTypeEnum";

export default interface Notification {
    user_id: string;
    message: string;
    created_at: Date;
    type: NotificationTypeEnum;
    detail?: any;
};
  