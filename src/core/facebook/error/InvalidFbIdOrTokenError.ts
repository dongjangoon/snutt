export default class InvalidFbIdOrTokenError extends Error {
    constructor(public fbId: string, public fbToken: string) {
        super("Invalid fbId or fbToken: '" + fbId + "', '" + fbToken + "'");
    }
}