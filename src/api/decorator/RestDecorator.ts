import express = require('express');
import log4js = require('log4js');
import RequestContext from '@app/api/model/RequestContext';
import ApiError from '../error/ApiError';
import ApiServerFaultError from '../error/ApiServerFaultError';
let logger = log4js.getLogger();

export function restController(router: express.Router, method:string, url: string) {
    return function(target: (context: RequestContext, request?: express.Request) => Promise<Object>, propertyKey?: string, descriptor?: PropertyDescriptor) {
        router[method](url, async function (req, res, next) {
            let context: RequestContext = req['context'];
            try {
                let result = await target(context, req);
                return res.json(result);
            } catch (err) {
                if (err instanceof ApiError) {
                    res.status(err.statusCode).json({
                        errcode: err.errorCode,
                        message: err.message
                    });
                } else {
                    logger.error({
                        method: method,
                        url: url,
                        platform: context.platform,
                        cause: err
                    });
                    let serverFaultError = new ApiServerFaultError();
                    res.status(serverFaultError.statusCode).json({
                        errcode: serverFaultError.errorCode,
                        message: serverFaultError.message
                    });
                }
            }
        });
    }
}

export function restGet(router: express.Router, url: string) {
    return restController(router, "get", url);
}

export function restPost(router: express.Router, url: string) {
    return restController(router, "post", url);
}

export function restPut(router: express.Router, url: string) {
    return restController(router, "put", url);
}

export function restDelete(router: express.Router, url: string) {
    return restController(router, "delete", url);
}
