import AppleJWK from "@app/core/apple/model/AppleJWK";
import request = require("request");
import ApiError from "@app/api/error/ApiError";
import AppleApiError from "@app/core/apple/error/AppleApiError";
import jwksClient = require('jwks-client');
import InvalidFbIdOrTokenError from "@app/core/facebook/error/InvalidFbIdOrTokenError";




export async function getMatchedKeyBy(kid: string, alg: string): Promise<AppleJWK> {
    try {
        const keys: Array<AppleJWK> = await new Promise<Array<AppleJWK>>(function (resolve, reject){
            request({
                url: "https://appleid.apple.com/auth/keys",
                method: "GET",
                json: true,
            }, function (err, res, body) {
                if (err || res.statusCode != 200 || !body ) {
                    return reject(new AppleApiError());
                } else {
                    return resolve(body);
                }
            });
        });
        return keys.filter((key) => key.kid === kid && key.alg === alg)[0]
    }
    catch (e) {
        throw e
    }
}
