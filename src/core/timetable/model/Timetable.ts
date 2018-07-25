import UserLecture from '@app/core/lecture/model/UserLecture';

export default interface Timetable {
    _id?: string;
    userId: string;
    year: number;
    semester: number;
    title: string;
    lectureList: UserLecture[];
    updatedAt: number;
};
  