import ErrorCode from './error-code'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: ErrorCode,
    public message: string,
  ) {
    super(message)
  }
}

export class ApiServerFaultError extends ApiError {
  constructor() {
    super(500, ErrorCode.SERVER_FAULT, 'Server error occured')
  }
}
