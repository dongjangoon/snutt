export default class TimetableNotEnoughParamError extends Error {
    constructor(public timetable: any) {
        super("Timetable not enough param: " + timetable);
    }
}
