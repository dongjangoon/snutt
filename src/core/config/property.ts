/**
 * @author ryeolj5911@gmail.com
 */
import fs = require("fs");
import yaml = require("js-yaml");

try {
    let yamlString = fs.readFileSync(__dirname + '/../../../../snutt.yml', 'utf8');
    var config:any = yaml.safeLoad(yamlString);
} catch (e) {
    throw new Error("Could not find config file.");
}

export function get(key: string) {
    let resolved = resolve(config, key);
    if (resolved === undefined) {
        throw new Error("Could not find config '" + key + "'");
    }
    return resolved;
}

function resolve(obj, path: string){
    let splitted = path.split('.');
    let current = obj;
    while(splitted.length > 0) {
        if (typeof current !== 'object') {
            return undefined;
        }
        current = current[splitted.shift()];
    }
    return current;
}

/*
export = {
    secretKey: config.secretKey,
    host: config.host,
    port: config.port,
    fcm_api_key: config.fcm.api_key,
    fcm_project_id: config.fcm.project_id,
    feedback2github_token: config.feedback2github.token,
    feedback2github_repo_name: config.feedback2github.repo_name,
    feedback2github_repo_owner: config.feedback2github.repo_owner,
    mongoUri: config.mongo,
    redisPort: config.redis.port
};
*/
