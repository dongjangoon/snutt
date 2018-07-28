export default class InvalidLocalIdError extends Error {
    constructor(public localId: string) {
        super("Invalid local id '" + localId + "'");
    }
}
