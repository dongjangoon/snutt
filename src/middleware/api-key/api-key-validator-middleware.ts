import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { validateKey } from './api-key-utils'

@Injectable()
export class ApiKeyValidatorMiddleware implements NestMiddleware {
  secretKey: string

  constructor(private readonly configService: ConfigService) {
    // TODO: warn no api key
    this.secretKey =
      this.configService.get<string>('SNUTT_SECRET_API_KEY') ?? ''
  }

  use(req: Request, res: Response, next: NextFunction): any {
    const apiKey = req.header('x-access-apikey')
    validateKey(apiKey, this.secretKey)
    next()
  }
}
