/**
 * @author ryeolj5911@gmail.com
 */
import fs = require("fs");
import yaml = require("js-yaml");

try {
    this.yamlString = fs.readFileSync(__dirname + '/../../../../snutt.yml', 'utf8');
    var config:any = yaml.safeLoad(this.yamlString);
} catch (e) {
    console.error(e.message);
    console.error("Could not find config file.");
    process.exit(1);
}

// Singleton
export = {
    secretKey: config.secretKey,
    host: config.host,
    port: config.port,
    fcm_api_key: config.fcm_api_key,
    fcm_project_id: config.fcm_project_id,
    feedback2github_token: config.feedback2github.token,
    feedback2github_repo_name: config.feedback2github.repo_name,
    feedback2github_repo_owner: config.feedback2github.repo_owner,
    mongoUri: config.mongo
};
