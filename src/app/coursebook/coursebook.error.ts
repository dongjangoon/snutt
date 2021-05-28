import { ApiError } from '@snutt-middleware/exception/api-error'
import ErrorCode from '@snutt-middleware/exception/error-code'

export class CoursebookNotFoundError extends ApiError {
  constructor() {
    super(404, ErrorCode.COURSEBOOK_NOT_FOUND, 'Coursebook does not exist')
  }
}
