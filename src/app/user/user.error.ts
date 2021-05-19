import ErrorCode from '../../middleware/exception/error-code'
import { ApiError } from '../../middleware/exception/api-error'

export class UserNotFoundError extends ApiError {
  constructor() {
    super(404, ErrorCode.USER_NOT_FOUND, 'user not found')
  }
}
