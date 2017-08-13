/**
 * credential field for making tokens
 * 모든 클라이언트는 이 파일에서 생성된 api key를
 * HTTP 요청 헤더에 포함해야 합니다. (위키 참조))
 *
 * API 키를 새로 발급하고 싶으면, npm run build를 수행 후
 * node로 다음 명령을 수행합니다.
 * $ npm run api-key
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */
import jwt = require('jsonwebtoken');
import config = require('./config');

/**
 * api key를 발급할 때 암호화에 사용되는 json입니다.
 * jwt에 고유한 config.secretKey를 사용하여 암호화하기 때문에
 * key_version을 바꾸면 새로운 키를 발급할 수 있습니다.
 * 혹은 임의의 필드를 삽입하여 salt로 사용할 수 있습니다.
 */
var api_list = {
    ios : {
      string : "ios",
      key_version : "0"
    },
    web : {
      string : "web",
      key_version : "0"
    },
    android : {
      string : "android",
      key_version : "0"
    },
    test : {
      string : "test",
      key_version : "0"
    }
};

/**
 * Deprecated
 */
var app_version = {
  ios : "1.0.0",
  web : "1.0.0",
  android : "1.0.0"
};

/**
 * Deprecated
 * @param string
 */
export function getAppVersion(string:string) {
  return app_version[string];
};

/**
 * secretKey를 이용하여 json을 암호화합니다.
 * @param api_obj
 */
function issueKey(api_obj) {
  return jwt.sign(api_obj, config.secretKey);
};

/**
 * API 키가 올바른 키인지 확인합니다.
 * API 키를 요구하는 모든 라우터에서 이 함수를 사용합니다.
 * @param api_key
 * @returns {Promise}
 */
export function validateKey(api_key:string):Promise<string> {
  if (process.env.NODE_ENV == 'mocha') {
    return new Promise(function(resolve, reject) {
      resolve();
    });
  }
  return new Promise(function(resolve, reject){
    jwt.verify(api_key, config.secretKey, function(err, decoded: any) {
      if (err) return reject("invalid api key");
      if (!decoded.string || !decoded.key_version) return reject("invalid api key");
      if (api_list[decoded.string] &&
        api_list[decoded.string].key_version == decoded.key_version)
        return resolve(api_list[decoded.string]);
    });
  });
};

if (!module.parent) {
  if (process.argv.length != 3 || process.argv[2] != "list") {
    console.log("Invalid arguments");
    console.log("usage: $ node apiKey.js list");
    process.exit(1);
  }

  for (var api in api_list) {
    if (api_list.hasOwnProperty(api)) {
      console.log(api_list[api].string);
      console.log("\n"+issueKey(api_list[api])+"\n");
    }
  }
}
