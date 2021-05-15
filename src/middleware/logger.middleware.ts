import { NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'

export class MorganMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    morgan('combined')(req, res, next)
  }
}
