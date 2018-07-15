export default class FcmError extends Error {
    constructor(public statusMessage: string) {
        super("Fcm error occured: '" + statusMessage + "'");
    }
}