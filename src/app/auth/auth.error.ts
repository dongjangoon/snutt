import { ApiError } from '@snutt-middleware/exception/api-error'
import ErrorCode from '@snutt-middleware/exception/error-code'

export class InvalidLocalPasswordError extends ApiError {
  constructor() {
    super(403, ErrorCode.INVALID_PASSWORD, 'invalid password')
  }
}

export class InvalidLocalIdError extends ApiError {
  constructor() {
    super(403, ErrorCode.INVALID_ID, 'invalid id')
  }
}

export class DuplicateLocalIdError extends ApiError {
  constructor() {
    super(403, ErrorCode.DUPLICATE_ID, 'duplicate id')
  }
}

export class InvalidAppleTokenError extends ApiError {
  constructor() {
    // FIXME: 최한결 머해
    super(403, ErrorCode.WRONG_FB_TOKEN, 'wrong fb token')
  }
}

export class InvalidFbIdOrTokenError extends ApiError {
  constructor() {
    super(403, ErrorCode.WRONG_FB_TOKEN, 'wrong fb token')
  }
}

export class WrongIdError extends ApiError {
  constructor() {
    super(403, ErrorCode.WRONG_ID, 'wrong id')
  }
}

export class WrongPasswordError extends ApiError {
  constructor() {
    super(403, ErrorCode.WRONG_PASSWORD, 'wrong password')
  }
}
