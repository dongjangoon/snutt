import UserLecture from './UserLecture';

export default interface Timetable {
    _id?: string;
    user_id: string;
    year: number;
    semester: number;
    title: string;
    lecture_list: UserLecture[];
    updated_at: number;
};
  