export default class WrongRefLectureSemesterError extends Error {
    constructor(public year: number, public semester: number) {
        super("Wrong ref lecture semester " + year + ", " + semester);
    }
}
