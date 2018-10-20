import ErrorCode from "../enum/ErrorCode";

export default class ApiError extends Error {
    constructor(public statusCode: number, public errorCode: ErrorCode, public message: string) {
        super(message);
    }
}
