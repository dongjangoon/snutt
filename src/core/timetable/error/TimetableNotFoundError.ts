export default class TimetableNotFoundError extends Error {
    constructor() {
        super("Timetable not found");
    }
}
