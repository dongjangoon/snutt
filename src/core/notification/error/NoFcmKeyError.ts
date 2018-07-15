export default class NoFcmKeyError extends Error {
    constructor() {
        super("Failed to send notification fcm due to no fcm key");
    }
}