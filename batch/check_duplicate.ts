/**
 * 현재 DB에 중복된 강의가 있는지 검사합니다.
 * 예전 업데이트 로직에 문제가 있었을 때 디버깅을 위해 사용한 유틸입니다.
 * 실행하려면 npm run build로 자바스크립트 파일을 빌드한 후
 * $ node check_duplicate 2016 1
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */

var LectureModel = require('../model/lecture').LectureModel;

if (process.argv.length != 4) {
  console.log("Invalid arguments");
  console.log("usage: $ node check_duplicate.js 2016 1");
  process.exit(1);
}

var year = Number(process.argv[2]);
var semester = process.argv[3];

LectureModel.find({year : year, semester : semester}, "year semester course_number lecture_number course_title", function(err, docs) {
  for (var i=0; i<docs.length; i++){
    process.stdout.write(i+"th lecture...\r");
    for (var j=0; j<i; j++) {
      if (LectureModel.is_equal(docs[i],docs[j])) {
        process.stdout.write(docs[i].course_title + ", " + docs[j].course_title + "\n");
      }
    }
  }
});

process.exit(0);