[![Build Status](https://travis-ci.org/wafflestudio/snutt.svg?branch=master)](https://travis-ci.org/wafflestudio/snutt)

# snutt
SNU Timetable

## Requirements
* mongodb >= 2.6
* node >= 4.2

## Deploying

`pm2`로 실행하기 전에 `snutt.yml` 파일이 올바르게 설정되어 있는지 확인하세요. 반드시 `snutt.yml`의 파일 시스템 권한이 600인지 확인하세요.

https 설정을 위해서는 `nginx`를 앞단에 프록시로 연결하여야 합니다.

아래 스크립트를 통해 필요 패키지를 설치하고, 2017년 1학기 수강편람을 불러온 후 pm2 watchdog을 실행합니다.
```sh
$ sudo apt-get install mongodb nodejs nodejs-legacy
$ sudo npm install pm2 -g
$ git clone https://github.com/wafflestudio/snutt.git && cd snutt
$ npm install
$ npm test
$ npm run coursebook
$ pm2 start app.js --name snuttapi
```

서버 배포판의 공식 repository에서 위 requirements에 해당하는 패키지 버전을 지원하지 않는다면, `nvm` 등을 이용하거나 다른 repository에서 설치해야 합니다. 

## API Keys
먼저 `snutt.yml`에 secret이 잘 입력되었는지 확인하세요.
```sh
$ npm run apikey
```

## cron job (매일 실행 추천)
```sh
$ node ~/snutt/batch/coursebook/main
```

반드시 환경 변수가 설정되어 있는지 확인해야 합니다. 유저 이름이 snutt이고 애플리케이션이 `~/snutt`에 위치할 때 다음과 같은 쉘 스크립트를 만들 수 있습니다. 스크립트는 stdout과 stderr을 `~/snutt_cron.log`로 출력합니다.

```bash
#!/bin/bash
node /home/snutt/snutt/batch/coursebook/main >> /home/snutt/snutt_cron.log 2>&1
```

crontab에서 쉘이 bash로 설정되어 있는지 확인하세요. 위 스크립트가 `~/snutt_cronjob.sh`일 때 실행 권한을 부여한 후 아래와 같이 설정하세요.

```
SHELL=/bin/bash
# m h dom mon dow command
0 18 * * * /home/snutt/snutt_cronjob.sh
```
