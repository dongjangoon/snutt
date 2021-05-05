export default class AppleApiError extends Error {
    constructor() {
        super("Apple server has a problem");
    }
}
