export default class NotLocalAccountError extends Error {
    constructor(public userId: string) {
        super("Not local account. user._id = '" + userId + "'");
    }
}