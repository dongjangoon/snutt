import { IsString } from 'class-validator'

export class LoginLocalDto {
  @IsString()
  id: string

  @IsString()
  password: string
}

export class RegisterLocalDto {
  @IsString()
  id: string

  @IsString()
  password: string

  @IsString()
  email: string
}
