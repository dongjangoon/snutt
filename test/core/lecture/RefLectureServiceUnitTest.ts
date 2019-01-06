import sinon = require('sinon');
import assert = require('assert');
import rewire = require('rewire');

import RefLecture from '@app/core/lecture/model/RefLecture';
import RefLectureService = require('@app/core/lecture/RefLectureService');
import RefLectureRepository = require('@app/core/lecture/RefLectureRepository');

let RefLectureServiceRewire = rewire<typeof RefLectureService>('@app/core/lecture/RefLectureService');

describe("RefLectureServiceUnitTest", function() {
  let sinonSandbox = sinon.createSandbox();

  afterEach(function() {
    sinonSandbox.restore();
  });

  it("querySortedByWhetherFirstCharMatches__korean", async function() {
    let query = {};
    let title = "한글 강의 제목";
    let titleFirstChar = "한";
    let limit = 10;
    let offset = 10;

    let expectedLecture: RefLecture = {
        "year": 2016,
        "semester": 3,
        "classification": "전선",
        "department": "컴퓨터공학부",
        "academic_year": "3학년",
        "course_number": "400.320",
        "lecture_number": "002",
        "course_title": "공학연구의 실습 1",
        "credit": 1,
        "class_time": "화(13-1)/목(13-1)",
        "instructor": "이제희",
        "quota": 15,
        "remark": "컴퓨터공학부 및 제2전공생만 수강가능",
        "category": "",
        /*
         * See to it that the server removes _id fields correctly
         */
        "_id": "56fcd83c041742971bd20a86",
        "class_time_mask": [
          0,
          12,
          0,
          12,
          0,
          0,
          0
        ],
        "class_time_json": [
          {
            "day": 1,
            "start": 13,
            "len": 1,
            "place": "302-308"
          },
          {
            "day": 3,
            "start": 13,
            "len": 1,
            "place": "302-308"
          }
        ],
    };

    let expected = [expectedLecture];
    let repositoryQueryStub = sinonSandbox.stub(RefLectureRepository, "querySortedByWhetherFirstCharMatches");
    repositoryQueryStub.withArgs(query, titleFirstChar, limit, offset).resolves(expected);

    let actual = await RefLectureServiceRewire.querySortedByWhetherFirstCharMatches(
        query, title, limit, offset);

    assert.equal(actual, expected);
  });

  it("querySortedByWhetherFirstCharMatches__english", async function() {
    let query = {};
    let title = "English 강의 제목";
    let titleFirstChar = "E";
    let limit = 10;
    let offset = 10;

    let expectedLecture: RefLecture = {
        "year": 2016,
        "semester": 3,
        "classification": "전선",
        "department": "컴퓨터공학부",
        "academic_year": "3학년",
        "course_number": "400.320",
        "lecture_number": "002",
        "course_title": "공학연구의 실습 1",
        "credit": 1,
        "class_time": "화(13-1)/목(13-1)",
        "instructor": "이제희",
        "quota": 15,
        "remark": "컴퓨터공학부 및 제2전공생만 수강가능",
        "category": "",
        /*
         * See to it that the server removes _id fields correctly
         */
        "_id": "56fcd83c041742971bd20a86",
        "class_time_mask": [
          0,
          12,
          0,
          12,
          0,
          0,
          0
        ],
        "class_time_json": [
          {
            "day": 1,
            "start": 13,
            "len": 1,
            "place": "302-308"
          },
          {
            "day": 3,
            "start": 13,
            "len": 1,
            "place": "302-308"
          }
        ],
    };

    let expected = [expectedLecture];
    let repositoryQueryStub = sinonSandbox.stub(RefLectureRepository, "querySortedByWhetherFirstCharMatches");
    repositoryQueryStub.withArgs(query, titleFirstChar, limit, offset).resolves(expected);

    let actual = await RefLectureServiceRewire.querySortedByWhetherFirstCharMatches(
        query, title, limit, offset);

    assert.equal(actual, expected);
  });
})
