import { ApiError } from '../exception/api-error'
import ErrorCode from '../exception/error-code'

export class InvalidApiKeyError extends ApiError {
  constructor() {
    super(403, ErrorCode.WRONG_API_KEY, 'invalid api key')
  }
}
