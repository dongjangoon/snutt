/**
 * {@link import_txt}에서 업데이트 로직을 모듈화
 * 
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */


/**
 * 직접 호출 시 종료
 */
if (!module.parent) {
  console.log("Not to be executed directly. Instead call import_txt.js");
  console.log("usage: $ node import_txt.js 2016 1");
  process.exit(1);
}

const db = require('../db'); // Unused imports will be deleted
import async = require('async');
import {LectureModel, LectureDocument} from '../../../model/lecture';
import {CourseBookModel} from '../../../model/courseBook';
import {NotificationModel, Type as NotificationType} from '../../../model/notification';
import {TimetableModel, TimetableDocument} from '../../../model/timetable';
import {TagListModel} from '../../../model/tagList';
import Util = require('../../../lib/util');
import fcm = require('../../../lib/fcm');
import errcode = require('../../../lib/errcode');

/*
 * 교양 영역을 한글로 번역.
 * fetch.rb를 수정하게 되면
 * 지난 수강편람을 모두 새로고침해야 하므로
 * 일단은 update_lectures에서 두번 해석
 */

var str_category = {
  "" : "",
  "foundation_writing":"사고와 표현",
  "foundation_language":"외국어",
  "foundation_math":"수량적 분석과 추론",
  "foundation_science":"과학적 사고와 실험",
  "foundation_computer":"컴퓨터와 정보 활용",
  "knowledge_literature":"언어와 문학",
  "knowledge_art":"문화와 예술",
  "knowledge_history":"역사와 철학",
  "knowledge_politics":"정치와 경제",
  "knowledge_human":"인간과 사회",
  "knowledge_nature":"자연과 기술",
  "knowledge_life":"생명과 환경",
  "general_physical":"체육",
  "general_art":"예술실기",
  "general_college":"대학과 리더십",
  "general_creativity":"창의와 융합",
  "general_korean":"한국의 이해"
};

type TagStruct = {
  classification : string[],
  department : string[],
  academic_year : string[],
  credit : string[],
  instructor : string[],
  category : string[]
};

function parseLines(year:number, semesterIndex:number, lines:string[]) : {
  new_lectures: LectureDocument[],
  tags: TagStruct
} {
  var new_lectures:LectureDocument[] = new Array<LectureDocument>();
  var tags:TagStruct = {
    classification : [],
    department : [],
    academic_year : [],
    credit : [],
    instructor : [],
    category : []
  };
  for (let i=0; i<lines.length; i++) {
    var line = lines[i];
    var components = line.split(";");
    if (components.length == 1) continue;
    if (components.length > 16) {
      console.log("Parsing error detected : ");
      console.log(line);
    }

    // 교양영역 번역
    components[13] = str_category[components[13]];
    if (components[13] === undefined) components[13] = "";
    // null(과학교육계) 고침
    components[1] = components[1].replace("null", "");

    var new_tag = {
      classification : components[0],
      department : components[1],
      academic_year : components[2],
      credit : components[6]+'학점',
      instructor : components[9],
      category : components[13]
    };

    for (let key in tags) {
      if (tags.hasOwnProperty(key)){
        var existing_tag = null;
        for (let j=0; j<tags[key].length; j++) {
          if (tags[key][j] == new_tag[key]){
            existing_tag = new_tag[key];
            break;
          }
        }
        if (existing_tag === null) {
          if (new_tag[key] === undefined) {
            console.log(key);
            console.log(components);
            console.log(line);
          }
          if (new_tag[key].length < 2) continue;
          tags[key].push(new_tag[key]);
        }
      }
    }

    var timeJson = Util.timeAndPlaceToJson(components[7], components[8]);
    if (timeJson === null) console.log(line);
    // TimeMask limit is 15*2
    for (let j=0; j<timeJson.length; j++) {
      var t_end = timeJson[j].start+timeJson[j].len;
      if (t_end > 15) {
        console.log("Warning: ("+components[3]+", "+components[4]+", "+components[5]+
          ") ends at "+t_end);
      }
    }

    new_lectures.push(new LectureModel({
      year: year,
      semester: semesterIndex,
      classification: components[0],
      department: components[1],
      academic_year: components[2],
      course_number: components[3],
      lecture_number: components[4],
      course_title: components[5],
      credit: Number(components[6]),
      class_time: components[7],
      class_time_json: timeJson,
      class_time_mask: Util.timeJsonToMask(timeJson),
      instructor: components[9],
      quota: Number(components[10]),
      enrollment: Number(components[11]),
      remark: components[12],
      category: components[13]
    }));
  }

  return {
    new_lectures: new_lectures,
    tags: tags
  }
}
