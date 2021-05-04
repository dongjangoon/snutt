/**
 *
 * @author Hank Choi, zlzlqlzl1@gmail.com
 */

import request = require('request');
import AppleUserInfo from "@app/core/apple/model/AppleUserInfo";
import * as jwt from "jsonwebtoken";
import {getMatchedKeyBy} from "@app/core/apple/AppleVerifyUtil";
import AppleJWK from "@app/core/apple/model/AppleJWK";
import pj = require('pem-jwk')
import crypto = require('crypto');



export function getAppleInfo(identityToken:string): Promise<{appleName:string, appleId:string}> {
  const headerOfIdentityToken = JSON.parse(Buffer.from(identityToken.substr(0,identityToken.indexOf('.')),'base64').toString());
  const publicKey: AppleJWK= await getMatchedKeyBy(headerOfIdentityToken.kid,headerOfIdentityToken.alg);
  jwt.verify(identityToken,JSON.stringify(publicKey))

  const userInfo: AppleUserInfo = jwt.decode(identityToken);
  return new Promise(function(resolve, reject) {
    request({
      url: "https://appleid.apple.com/auth/token",
      method: "GET",
      json: true,
      qs: {access_token: appleToken}
    }, function (err, res, body) {
      if (err || res.statusCode != 200 || !body || !body.id || fbId !== body.id) {
        return reject(new InvalidFbIdOrTokenError(fbId, fbToken));
      } else {
        return resolve({fbName: body.name, fbId: body.id});
      }
    });
  });
}

export function decodeAppleIdentityToken(token): AppleUserInfo {
  const appleUserInfo:AppleUserInfo = jwt.decode(token)
  return new Promise(function(resolve, reject) {
    request({
      url: "https://appleid.apple.com/auth/token",
      method: "GET",
      json: true,
      qs: {access_token: appleToken}
    }, function (err, res, body) {

    }
}
