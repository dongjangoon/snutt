export default class DuplicateTimetableTitleError extends Error {
    constructor(public userId: string, public year: number, public semester: number, public title: string) {
        super("Duplicate Timetable Title '" + title + "'");
    }
}
