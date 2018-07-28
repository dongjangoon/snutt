import User from '@app/core/user/model/User';

export default interface RequestContext {
    user?: User,
    platform?: string
}