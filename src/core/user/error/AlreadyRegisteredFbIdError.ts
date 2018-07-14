export default class AlreadyRegisteredFbIdError extends Error {
    constructor(public fbId: string) {
        super("Already registered facebook ID '" + fbId + "'");
    }
}