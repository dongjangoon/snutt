import { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import { Response } from 'express'
import { ApiError, ApiServerFaultError } from './api-error'

export class SNUTTExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const sealedException =
      exception instanceof ApiError ? exception : new ApiServerFaultError()

    // log on ApiServerFaultError
    if (!exception) {
      console.log(exception)
    }

    response.status(sealedException.statusCode).json({
      errcode: sealedException.errorCode,
      message: sealedException.message,
    })
  }
}
