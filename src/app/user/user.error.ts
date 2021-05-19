import ErrorCode from '@snutt-middleware/exception/error-code'
import { ApiError } from '@snutt-middleware/exception/api-error'

export class UserNotFoundError extends ApiError {
  constructor() {
    super(404, ErrorCode.USER_NOT_FOUND, 'user not found')
  }
}
