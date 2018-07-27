export default class TimetableNotEnoughParamError extends Error {
    constructor(public params: any) {
        super("Timetable not enough param: " + params);
    }
}
