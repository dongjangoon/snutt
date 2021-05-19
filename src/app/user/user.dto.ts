export interface UserInfoDto {
  isAdmin: boolean
  regDate: Date
  notificationCheckedAt: Date
  email: string
  // Refactoring: need check
  // nullable 한지 모름
  local_id?: string
  fb_name?: string
}
