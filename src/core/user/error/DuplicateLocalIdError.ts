export default class DuplicateLocalIdError extends Error {
    constructor(public localId: string) {
        super("Duplicate local id '" + localId + "'");
    }
}