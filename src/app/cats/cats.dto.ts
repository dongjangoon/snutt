import { IsNumber, IsString } from 'class-validator'

export class CatsDto {
  @IsNumber()
  count: number

  @IsString()
  name: string
}
