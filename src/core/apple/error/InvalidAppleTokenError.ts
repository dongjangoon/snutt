export default class InvalidAppleTokenError extends Error {
    constructor(public appleToken: string) {
        super("Invalid apple token: '" + appleToken + "'");
    }
}
