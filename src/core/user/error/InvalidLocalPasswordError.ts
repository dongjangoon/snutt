export default class InvalidLocalPasswordError extends Error {
    constructor(public localPassword: string) {
        super("Invalid local password '" + localPassword + "'");
    }
}