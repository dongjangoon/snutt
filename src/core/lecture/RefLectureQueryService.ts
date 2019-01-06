import * as log4js from 'log4js';
import RefLectureQueryCacheRepository = require('@app/core/lecture/RefLectureQueryCacheRepository');

import RefLectureService = require('./RefLectureService');
import RefLectureQueryEtcTagService = require('./RefLectureQueryEtcTagService');
import RefLectureQueryLogRepository = require('./RefLectureQueryLogRepository');
import RefLecture from './model/RefLecture';
import InvalidLectureTimemaskError from './error/InvalidLectureTimemaskError';
import EtcTagEnum from "@app/core/taglist/model/EtcTagEnum";
var logger = log4js.getLogger();

const CACHE_PAGE_SIZE = 20;
const CACHE_PREFETCH_NUM_PAGE = 5;

function makeLikeRegEx(str: string): string {
  //replace every character(eg. 'c') to '.*c', except for first character
  var cstr = str.split("");
  cstr = cstr.filter(x => x !== ' ');
  var joined = cstr.join('[^()]*');
  return joined;
}

function isHangulCode(c:number) {	
  if( 0x1100<=c && c<=0x11FF ) return true;	
  if( 0x3130<=c && c<=0x318F ) return true;	
  if( 0xAC00<=c && c<=0xD7A3 ) return true;	
  return false;	
}

function isHangulInString(str:string) {	
  for (let i=0; i<str.length; i++) {	
    let code = str.charCodeAt(i);	
    if (isHangulCode(code)) return true;	
  }	
  return false;	
}	

/*	
 * Find like ??학점	
 */	
const creditRegex = /^(\d+)학점$/;	
function getCreditFromString(str:string): number {	
  let result = str.match(creditRegex);	
  if (result) return Number(result[1]);	
  else return null;	
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
    mquery["course_title"] = { $regex: makeLikeRegEx(lquery.title), $options: 'i' };
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

  if (lquery.title) {
    delete mquery["course_title"];
    mquery = {
      $and: [
        mquery,
        makeSearchQueryFromTitle(lquery.title),
      ]
    }
  }

  if (lquery.etc) {
    mquery = {
      $and : [
        mquery,
        RefLectureQueryEtcTagService.getMQueryFromEtcTagList(lquery.etc),
      ]
    }
  }

  return mquery;
}

export async function getLectureListByQueryWithCache(lquery: LectureQuery): Promise<RefLecture[]> {
  if (!lquery.limit) lquery.limit = 20;
  if (!lquery.offset) lquery.offset = 0;
  if (isTitleOnlyQuery(lquery) && lquery.title) {
    return await getCachedLectureListByLimitAndOffset(lquery, lquery.limit, lquery.offset);
  } else {
    return await getLectureListByQuery(lquery, lquery.limit, lquery.offset);
  }
}

function getLectureListByQuery(lquery: LectureQuery, limit: number, offset: number): Promise<RefLecture[]> {
  var mquery = toMongoQuery(lquery);
  if (lquery.title) {
    return RefLectureService.querySortedByWhetherFirstCharMatches(mquery, lquery.title, limit, offset);
  } else {
    return RefLectureService.query(mquery, limit, offset);
  }
}

async function getCachedLectureListByLimitAndOffset(lquery: LectureQuery, limit: number, offset: number): Promise<RefLecture[]> {
  if (limit === 0) {
    return [];
  }
  let firstPage = Math.floor(offset / 20);
  let lastPage = Math.ceil((offset + limit) / 20) - 1;
  let pageLimit = lastPage - firstPage + 1;
  let pageOffset = firstPage;

  let lectureList = await getCachedLectureList(lquery, pageLimit, pageOffset);
  let sliceStart = offset % 20;
  let sliceEnd = sliceStart + limit;
  return lectureList.slice(sliceStart, sliceEnd);
}

async function getCachedLectureList(lquery: LectureQuery, pageLimit: number, pageOffset: number): Promise<RefLecture[]> {
  let ret: RefLecture[] = [];
  let pageList = makeIntegerSequence(pageOffset, pageLimit);
  let cachedList = await RefLectureQueryCacheRepository.getListOfLectureListCacheFromPageList(lquery.year, lquery.semester, lquery.title, pageList);
  for (let i = 0; i < pageLimit; i++) {
    if (cachedList[i] === null) {
      ret.push.apply(ret, await setCachedLectureList(lquery, pageLimit - i, pageOffset + i));
      break;
    }

    ret.push.apply(ret, cachedList[i]);
    
    // 다음 페이지엔 데이터가 없다
    if (cachedList[i].length < CACHE_PAGE_SIZE) {
        break;
    }
  }
  return ret;
}

function makeIntegerSequence(start: number, n: number): number[] {
  return Array.from(new Array(n), (_, index) => start + index);
}

async function setCachedLectureList(lquery: LectureQuery, pageLimit: number, pageOffset: number): Promise<RefLecture[]> {
  const pageLimitWithPrefetch = pageLimit + CACHE_PREFETCH_NUM_PAGE;
  const limit = pageLimitWithPrefetch * CACHE_PAGE_SIZE;
  const offset = pageOffset * CACHE_PAGE_SIZE;
  let lectureList = await getLectureListByQuery(lquery, limit, offset);

  // Cache 없이 검색한 결과를 미리 반환한다
  for (let i=0; i < pageLimitWithPrefetch; i++) {
    let lectureSlice = lectureList.slice(CACHE_PAGE_SIZE * i, CACHE_PAGE_SIZE * (i+1));
    RefLectureQueryCacheRepository.setLectureListCache(
      lquery.year, lquery.semester, lquery.title, pageOffset + i, lectureSlice)
      .catch(function(err) {
        logger.error(err);
      });
  }

  return lectureList.slice(0, pageLimit * CACHE_PAGE_SIZE);
}

function isTitleOnlyQuery(lquery: LectureQuery): boolean {
  for (let key in lquery) {
    if (lquery.hasOwnProperty(key)) {
      if (key === 'year' || key === 'semester' || key === 'title' || key === 'offset' || key === 'limit') {
        continue;
      } else {
        if (!isEmptyArray(lquery[key])) {
          return false;
        }
      }
    }
  }
  return true;
}

function isEmptyArray(array: any[]): boolean {
  return array === null || array === undefined || (typeof array.length === 'number' && array.length === 0);
}

/**
 * 타이틀로부터 정보를 뽑아내어 상세 검색을 돕는다
 */
function makeSearchQueryFromTitle(title: string): Object {
  var words = title.split(' ');	
  var andQueryList = [];	
  for(let i=0; i<words.length; i++) {	
    var orQueryList = [];	
    var result;	
    if (words[i] == '전공') {	
      /* 전공은 전선 혹은 전필 */	
      orQueryList.push({ classification : { $in: [ "전선", "전필" ] } });	
    } else if (words[i] == '석박' || words[i] == '대학원') {	
      /*	
       * 아래에서 classification은 like query가 아니므로 '석박'으로 검색하면 결과가 안나옴.	
       */	
      orQueryList.push({ academic_year : { $in : ["석사", "박사", "석박사통합"] } });	
    } else if (words[i] == '학부' || words[i] == '학사') {	
      orQueryList.push({ academic_year : { $nin : ["석사", "박사", "석박사통합"] } });	
    } else if (words[i] == '체육') {
      /**
       * 체육 교양 검색하려다가 체교과 전공 넣는 수가 있다
       */
      orQueryList.push({ category: '체육'});
    } else if (words[i] == '영강' || words[i] == '영어강의') {
      orQueryList.push(RefLectureQueryEtcTagService.getMQueryFromEtcTag(EtcTagEnum.ENGLISH_LECTURE));
    } else if (words[i] == '군휴학' || words[i] == '군휴학원격') {
      orQueryList.push(RefLectureQueryEtcTagService.getMQueryFromEtcTag(EtcTagEnum.MILITARY_REMOTE_LECTURE));
    } else if (result = getCreditFromString(words[i])) {	
      /*	
       * LectureModel에는 학점이 정수로 저장됨.	
       * '1학점' '3학점'과 같은 단어에서 학점을 정규식으로 추출	
       */	
      orQueryList.push({ credit : result });	
    } else if (isHangulInString(words[i])) {
      let regex = makeLikeRegEx(words[i]);
      orQueryList.push({ course_title : { $regex: regex, $options: 'i' } });
      /*	
       * 교수명을 regex로 처리하면 '수영' -> 김수영 교수님의 강좌, 조수영 교수님의 강좌와 같이	
       * 원치 않는 결과가 나옴	
       */	
      orQueryList.push({ instructor : words[i] });
      orQueryList.push({ category : { $regex: regex, $options: 'i' } });

      var lastChar = words[i].charAt(words[i].length - 1);	
      /*
       * 마지막 글자가 '학'이라면 해당 학과의 수업이 모두 포함될 확률이 높다. 수학, 물리학, 경제학 etc
       */
      if (lastChar !== '학') {
        /*	
         * '컴공과', '전기과' 등으로 검색할 때, 실제 학과명은 '컴퓨터공학부', '전기공학부'이므로	
         * 검색이 안됨. 만약 '과' 혹은 '부'로 끝나는 단어라면 regex의 마지막 단어를 빼버린다.	
         */	
        if (lastChar == '과' || lastChar == '부') {	
          orQueryList.push({ department : { $regex: '^'+regex.slice(0, -1), $options: 'i' } });	
        } else {	
          orQueryList.push({ department : { $regex: '^'+regex, $options: 'i' } });	
        }
      }
      orQueryList.push({ classification : words[i] });	
      orQueryList.push({ academic_year : words[i] });	
    } else {	
      /* 한국인이므로 영문은 약자로 입력하지 않는다고 가정 */	
      let regex = words[i];	
      orQueryList.push({ course_title : { $regex: regex, $options: 'i' } });	
      /* 영문 이름의 교수는 성이나 이름만 입력하는 경우가 많음 */	
      orQueryList.push({ instructor : { $regex: regex, $options: 'i' } });	
      orQueryList.push({ course_number : words[i] });	
      orQueryList.push({ lecture_number : words[i] });	
    }	
    	
    andQueryList.push({"$or" : orQueryList});	
  }
  return { $and: andQueryList };
}
