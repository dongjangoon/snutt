import RequestContext from "../model/RequestContext";
import apiKey = require('@app/core/config/apiKey');
import ErrorCode from "../enum/ErrorCode";
import ApiError from "../error/ApiError";

export default async function(req, res) {
    var token = <string>req.headers['x-access-apikey'];
    let context: RequestContext = req['context'];
    
    try {
        context.platform = await apiKey.validateKey(token);
        return Promise.resolve('next');
    } catch (err) {
        throw new ApiError(403, ErrorCode.WRONG_API_KEY, err);
    }
}
