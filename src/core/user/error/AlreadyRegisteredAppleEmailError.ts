export default class AlreadyRegisteredFbIdError extends Error {
    constructor(public appleEmail: string) {
        super("Already registered apple email '" + appleEmail + "'");
    }
}
