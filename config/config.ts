/**
 * 프로젝트 전체에서 사용하는 config 파일입니다.
 * 환경 변수로부터 설정을 입력받습니다.
 * 개발자는 git 등의 형상관리 시스템에
 * 이 파일에 사용되는 설정이 포함되지 않도록 주의해야 합니다.
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */
class SnuttConfig {
    production:string = process.env.SNUTT_PRODUCTION;
    secretKey:string = process.env.SNUTT_SECRET;
    host:string = process.env.SNUTT_HOST;
    port:string = process.env.SNUTT_PORT;
    protocol:string = process.env.SNUTT_PROTOCOL;
    email:string = process.env.SNUTT_EMAIL;
    ssl_key:string = process.env.SNUTT_SSL_KEY;
    ssl_cert:string = process.env.SNUTT_SSL_CERT;
    fcm_api_key:string = process.env.SNUTT_FCM_API_KEY;
    fcm_project_id:string = process.env.SNUTT_FCM_PROJECT_ID;

    SnuttConfig() {
        if (this.production && process.env.NODE_ENV != "mocha")
            process.env.NODE_ENV = "production";
    }
}

export = new SnuttConfig();
