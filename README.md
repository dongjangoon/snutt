[![Build Status](https://travis-ci.org/wafflestudio/snutt.svg?branch=master)](https://travis-ci.org/wafflestudio/snutt)

# snutt
SNU Timetable API 서버

서울대학교 수강편람 검색 및 시간표 관리를 위한 애플리케이션입니다.

## Framework
 본 레포는 REST API 서버로서 별도의 프론트엔드 클라이언트가 필요합니다. 기기 알림과 페이스북 로그인을 지원하며, 이를 위해서는 구글 Firebase와 Facebook 프로젝트를 별도로 설정해야 합니다. MongoDB를 데이터베이스로 사용합니다.

## Requirements
* Linux (CentOS, Ubuntu, Arch, etc.)
* Node.js 4.2+ and corresponding npm
* MongoDB 2.6+

## Documentation
[깃헙 위키](https://github.com/wafflestudio/snutt/wiki/Deploying-2.0.0)

## Front-end Clients
* [Web Client](https://github.com/wafflestudio/snutt-webclient/)
* [Android Client](https://github.com/wafflestudio/SNUTT-android)
* [iOS Client](https://github.com/wafflestudio/SNUTT-iOS)

## Liability
SNUTT는 [서울대학교 수강편람 서비스](http://sugang.snu.ac.kr)에서 데이터를 다운로드 후 가공합니다. 잦은 크롤링을 수행하면, 서울대학교 측으로부터 IP 밴 등의 불이익이 있을 수 있습니다. 와플스튜디오는 데이터 크롤링에 수반하는 일체의 불이익에 대하여 책임지지 않으며 본 프로그램을 사용하는 경우 서울대학교 서비스에 부하를 가하기 않도록 유의하여야 합니다. 현재 SNUTT는 하루 한 번 데이터를 업데이트하고 있습니다.

## 다른 학교에서도 이용할 수 있나요?
다음과 같은 사항을 수정해야합니다.
1. `src/batch/coursebook`을 수정해서, 해당 학교의 수강편람을 받아올 수 있도록 해야 합니다. '태그' 기능이 알맞게 적용할 수 있는지 확인합니다.
2. 해당 학교의 강의 정보가 현재 강의 및 시간표 모델에 적합한지 확인해야 합니다. 적합하지 않을 때에는, `src/core/model`의 lecture, timetable, query 부분을 수정하여야 합니다.