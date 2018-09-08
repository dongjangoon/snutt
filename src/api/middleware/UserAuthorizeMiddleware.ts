import RequestContext from "../model/RequestContext";
import ErrorCode from "../enum/ErrorCode";
import UserService = require('@app/core/user/UserService');
import ApiError from '../error/ApiError';

export default async function(req, res) {
    let context: RequestContext = req['context'];
    var token = req.query.token || req.body.token || req.headers['x-access-token'];
    if (!token) {
        throw new ApiError(401, ErrorCode.NO_USER_TOKEN, "No token provided");
    }

    let user = await UserService.getByCredentialHash(token);
    if (!user) {
        throw new ApiError(403, ErrorCode.WRONG_USER_TOKEN, "Failed to authenticate token");
    }

    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    UserService.updateLastLoginTimestamp(user);
    context.user = user;
    return Promise.resolve('next');
}
