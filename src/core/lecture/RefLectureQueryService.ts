import * as log4js from 'log4js';

import RefLectureService = require('./RefLectureService');
import RefLectureQueryEtcTagService = require('./RefLectureQueryEtcTagService');
import RefLectureQueryLogRepository = require('./RefLectureQueryLogRepository');
import RefLecture from './model/RefLecture';
import InvalidLectureTimemaskError from './error/InvalidLectureTimemaskError';
var logger = log4js.getLogger();

//something similar to LIKE query in SQL
function makeTitleRegEx(str: string): string {
  //replace every character(eg. 'c') to '.*c', except for first character
  var cstr = str.split("");
  cstr = cstr.filter(x => x !== ' ');
  var joined = '^' + cstr.join('[^()]*');
  return joined;
}

export function addQueryLogAsync(query) {
  RefLectureQueryLogRepository.insert(query).catch(function(err) {
    logger.error("addQueryLogAsync failed : " + err);
  })
}

export function removeQueryLogBeforeTimestamp(timestamp: number): Promise<void> {
  return RefLectureQueryLogRepository.deleteBeforeTimestamp(timestamp);
}

/**
 * 라우터의 Body를 자료구조로 만듦
 */
export type LectureQuery = {
  year:number;
  semester:number;
  title:string;
  classification:string[];
  credit:number[];
  course_number:string[];
  academic_year:string[];
  instructor:string[];
  department:string[];
  category:string[];
  time_mask:number[];
  etc:string[];
  offset:number;
  limit:number;
}

/**
 * 라우터에서 전송받은 Body를 mongo query로 변환
 */
function toMongoQuery(lquery:LectureQuery): Object {
  var mquery = {}; // m for Mongo
  mquery["year"] = lquery.year;
  mquery["semester"] = lquery.semester;
  if (lquery.title)
    mquery["course_title"] = { $regex: makeTitleRegEx(lquery.title), $options: 'i' };
  if (lquery.credit && lquery.credit.length)
    mquery["credit"] = { $in: lquery.credit };
  if (lquery.instructor && lquery.instructor.length)
    mquery["instructor"] = { $in : lquery.instructor };
  if (lquery.academic_year && lquery.academic_year.length)
    mquery["academic_year"] = { $in : lquery.academic_year };
  if (lquery.course_number && lquery.course_number.length)
    mquery["course_number"] = { $in : lquery.course_number };
  if (lquery.classification && lquery.classification.length)
    mquery["classification"] = { $in : lquery.classification };
  if (lquery.category && lquery.category.length)
    mquery["category"] = { $in : lquery.category };
  if (lquery.department && lquery.department.length) // in this case result should be sorted by departments
    mquery["department"] = { $in : lquery.department };
  if (lquery.time_mask) {
    if (lquery.time_mask.length != 7) {
      throw new InvalidLectureTimemaskError();
    }
    /**
     * 시간이 아예 입력되지 않은 강의는 제외
     * 시간 검색의 의미에 잘 맞지 않는다고 판단, 제외했음
     */ 
    mquery["$where"] = "(";
    for (let i=0; i< 7; i++) {
      if (i > 0) mquery["$where"] += " || ";
      mquery["$where"] += "this.class_time_mask[" + i + "] != 0";
    }
    mquery["$where"] += ")";

    /**
     * 타임마스크와 비트 연산
     */
    lquery.time_mask.forEach(function(bit, idx) {
      mquery["$where"] += " && ((this.class_time_mask["+idx+"] & "+(~bit<<1>>>1)+") == 0)";
    });
  }

  if (lquery.etc) {
    mquery = {
      $and : [
        mquery,
        RefLectureQueryEtcTagService.getEtcTagMQuery(lquery.etc)
      ]
    }
  }

  return mquery;
}

/**
 * Course title을 분석하여
 * 전공, 학과, 학년 등의 정보를 따로 뽑아냄.
 */
export function extendedSearch(lquery: LectureQuery): Promise<RefLecture[]> {
  var mquery = toMongoQuery(lquery);

  var offset, limit;
  if (!lquery.offset) offset = 0;
  else offset = lquery.offset;
  if (!lquery.limit) limit = 20;
  else limit = lquery.limit;

  return RefLectureService.query(mquery, limit, offset);
}
