/**
 *
 * @author Hank Choi, zlzlqlzl1@gmail.com
 */

import request = require('request');
import AppleUserInfo from "@app/core/apple/model/AppleUserInfo";
import * as jwt from "jsonwebtoken";
import {getMatchedKeyBy} from "@app/core/apple/AppleVerifyUtil";
import AppleJWK from "@app/core/apple/model/AppleJWK";
import crypto = require('crypto');
const jwkToPem = require('jwk-to-pem');



export async function getAppleInfo(identityToken: string){
  const headerOfIdentityToken = JSON.parse(Buffer.from(identityToken.substr(0, identityToken.indexOf('.')), 'base64').toString());
  const appleJwk: AppleJWK = await getMatchedKeyBy(headerOfIdentityToken.kid, headerOfIdentityToken.alg);
  const publicKey = jwkToPem(appleJwk);
  jwt.verify(identityToken, publicKey, {algorithms: [appleJwk.alg],issuer: "https://appleid.apple.com",audience: "9RQ8S5ZACJ"});

  // const userInfo: AppleUserInfo = jwt.decode(identityToken);
  // return new Promise(function (resolve, reject) {
  //   request({
  //     url: "https://appleid.apple.com/auth/token",
  //     method: "GET",
  //     json: true,
  //     qs: {access_token: appleToken}
  //   }, function (err, res, body) {
  //     if (err || res.statusCode != 200 || !body || !body.id || fbId !== body.id) {
  //       return reject(new InvalidFbIdOrTokenError(fbId, fbToken));
  //     } else {
  //       return resolve({fbName: body.name, fbId: body.id});
  //     }
  //   });
  // });
}

export function decodeAppleIdentityToken(token) {
}
