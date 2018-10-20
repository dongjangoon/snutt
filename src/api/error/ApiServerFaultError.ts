import ApiError from "./ApiError";
import ErrorCode from "../enum/ErrorCode";

export default class ApiServerFaultError extends ApiError {
    constructor() {
        super(500, ErrorCode.SERVER_FAULT, "Server error occured");
    }
}
