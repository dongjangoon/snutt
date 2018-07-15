import mongoose = require('mongoose');

export default interface Timetable {
    _id: string;
    userId: string;
    year: number;
    semester: number;
    title: string;
    lectureList: mongoose.Types.DocumentArray<any>;
    updatedAt: number;
};
  