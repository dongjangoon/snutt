import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export interface IUserCredential {
  localId?: string
  localPw?: string
  fbName?: string
  fbId?: string
  appleEmail?: string
  appleSub?: string
  tempDate?: Date
  tempSeed?: number
}

@Schema()
export class UserCredential extends Document {
  @Prop({ type: String, default: null })
  localId?: string

  @Prop({ type: String, default: null })
  localPw?: string

  @Prop({ type: String, default: null })
  fbName?: string

  @Prop({ type: String, default: null })
  fbId?: string

  @Prop({ type: String, default: null })
  appleEmail?: string

  @Prop({ type: String, default: null })
  appleSub?: string

  // 위 항목이 없어도 unique credentialHash을 생성할 수 있도록
  // 임시 가입 날짜
  @Prop({ type: String, default: null })
  tempDate?: Date

  // 위 항목이 없어도 unique credentialHash을 생성할 수 있도록
  // random seed
  @Prop({ type: String, default: null })
  tempSeed?: number
}

export const UserCredentialSchema = SchemaFactory.createForClass(UserCredential)

@Schema()
export class UserEntity extends Document {
  @Prop({ type: UserCredentialSchema })
  credential: IUserCredential

  // credential이 변경될 때 마다 SHA 해싱 (model/user.ts 참조)
  @Prop({ default: null })
  credentialHash?: string

  // admin 항목 접근 권한
  @Prop({ default: false })
  isAdmin: boolean
  // 회원가입 날짜
  @Prop({ type: Date })
  regDate: Date

  // routes/api/api.ts의 토큰 인증에서 업데이트
  @Prop()
  lastLoginTimestamp: number

  // 새로운 알림이 있는지 확인하는 용도
  @Prop()
  notificationCheckedAt: Date

  @Prop()
  email: string

  // Firebase Message Key
  @Prop()
  fcmKey: string

  // if the user remove its account, active status becomes false
  // Should not remove user object, because we must preserve the user data and its related objects
  @Prop({ type: Boolean, default: true })
  active: boolean
}

export const UserEntitySchema = SchemaFactory.createForClass(UserEntity)
