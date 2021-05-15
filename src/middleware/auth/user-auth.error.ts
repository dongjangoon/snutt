import { ApiError } from '../exception/api-error'
import ErrorCode from '../../legacy/api/enum/ErrorCode'

export class NoUserTokenError extends ApiError {
  constructor() {
    super(401, ErrorCode.NO_USER_TOKEN, 'No token provided')
  }
}

export class WrongUserTokenError extends ApiError {
  constructor() {
    super(403, ErrorCode.WRONG_USER_TOKEN, 'Failed to authenticate token')
  }
}
