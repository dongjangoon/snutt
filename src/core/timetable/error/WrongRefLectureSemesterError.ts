export default class DuplicateTimetableTitleError extends Error {
    constructor(public year: number, public semester: number) {
        super("Wrong ref lecture semester " + year + ", " + semester);
    }
}
