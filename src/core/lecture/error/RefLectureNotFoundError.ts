export default class RefLectrureNotFoundError extends Error {
    constructor(public lectureId: string) {
        super("RefLecture not found. lectureId: " + lectureId);
    }
}
