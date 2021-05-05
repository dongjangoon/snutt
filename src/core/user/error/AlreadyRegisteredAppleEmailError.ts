export default class AlreadyRegisteredAppleEmailError extends Error {
    constructor(public appleEmail: string) {
        super("Already registered apple email '" + appleEmail + "'");
    }
}
