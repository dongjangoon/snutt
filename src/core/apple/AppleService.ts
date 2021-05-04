/**
 *
 * @author Hank Choi, zlzlqlzl1@gmail.com
 */

import * as jwt from "jsonwebtoken";
import {getMatchedKeyBy} from "@app/core/apple/AppleVerifyUtil";
import AppleJWK from "@app/core/apple/model/AppleJWK";
import pemjwk = require("pem-jwk");
import AppleUserInfo from "@app/core/apple/model/AppleUserInfo";

export async function getAppleInfo(identityToken: string): Promise<AppleUserInfo>{
  const headerOfIdentityToken = JSON.parse(Buffer.from(identityToken.substr(0, identityToken.indexOf('.')), 'base64').toString());
  const appleJwk: AppleJWK = await getMatchedKeyBy(headerOfIdentityToken.kid, headerOfIdentityToken.alg);
  const publicKey = pemjwk.jwk2pem(appleJwk);
  jwt.verify(identityToken, publicKey, {algorithms: [appleJwk.alg],issuer: "https://appleid.apple.com",audience: "9RQ8S5ZACJ"});
  return <AppleUserInfo>jwt.decode(identityToken)
}
