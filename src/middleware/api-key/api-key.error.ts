import { ApiError } from '../exception/api-error'
import ErrorCode from '../../legacy/api/enum/ErrorCode'

export class InvalidApiKeyError extends ApiError {
  constructor() {
    super(403, ErrorCode.WRONG_API_KEY, 'invalid api key')
  }
}
