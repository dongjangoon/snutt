import * as xlsx from 'xlsx';
import * as http from 'http';
import * as request from 'request-promise-native';
import * as log4js from 'log4js';
import * as fs from 'fs';
var logger = log4js.getLogger();

enum LectureCategory {
  FOUNDATION_WRITING        = 40,
  FOUNDATION_LANGUAGE       = 41,
  FOUNDATION_MATH           = 42,
  FOUNDATION_SCIENCE        = 43,
  FOUNDATION_COMPUTER       = 44,
  KNOWLEDGE_LITERATURE      = 45,
  KNOWLEDGE_ART             = 46,
  KNOWLEDGE_HISTORY         = 47,
  KNOWLEDGE_POLITICS        = 48,
  KNOWLEDGE_HUMAN           = 49,
  KNOWLEDGE_NATURE          = 50,
  KNOWLEDGE_LIFE            = 51,
  GENERAL_PHYSICAL          = 52,
  GENERAL_ART               = 53,
  GENERAL_COLLEGE           = 54,
  GENERAL_CREATIVITY        = 55,
  GENERAL_KOREAN            = 56,
}

const lectureCategoryValues:number[] = Object.keys(LectureCategory)
                                      .map(k => LectureCategory[k])
                                      .filter(v => typeof v === "number") as number[];

const SEMESTER_1 = 1;
const SEMESTER_S = 2;
const SEMESTER_2 = 3;
const SEMESTER_W = 4;

const lectureCategoryString = {
  [LectureCategory.FOUNDATION_WRITING]:     "사고와 표현",
  [LectureCategory.FOUNDATION_LANGUAGE]:    "외국어",
  [LectureCategory.FOUNDATION_MATH]:        "수량적 분석과 추론",
  [LectureCategory.FOUNDATION_SCIENCE]:     "과학적 사고와 실험",
  [LectureCategory.FOUNDATION_COMPUTER]:    "컴퓨터와 정보 활용",
  [LectureCategory.KNOWLEDGE_LITERATURE]:   "언어와 문학",
  [LectureCategory.KNOWLEDGE_ART]:          "문화와 예술",
  [LectureCategory.KNOWLEDGE_HISTORY]:      "역사와 철학",
  [LectureCategory.KNOWLEDGE_POLITICS]:     "정치와 경제",
  [LectureCategory.KNOWLEDGE_HUMAN]:        "인간과 사회",
  [LectureCategory.KNOWLEDGE_NATURE]:       "자연과 기술",
  [LectureCategory.KNOWLEDGE_LIFE]:         "생명과 환경",
  [LectureCategory.GENERAL_PHYSICAL]:       "체육",
  [LectureCategory.GENERAL_ART]:            "예술실기",
  [LectureCategory.GENERAL_COLLEGE]:        "대학과 리더쉽",
  [LectureCategory.GENERAL_CREATIVITY]:     "창의와 융합",
  [LectureCategory.GENERAL_KOREAN]:         "한국의 이해"
};

const semesterString = {
  [SEMESTER_1]: "1",
  [SEMESTER_S]: "S",
  [SEMESTER_2]: "2",
  [SEMESTER_W]: "W",
}

const semesterQueryString = {
  [SEMESTER_1]: "U000200001U000300001",
  [SEMESTER_S]: "U000200001U000300002",
  [SEMESTER_2]: "U000200002U000300001",
  [SEMESTER_W]: "U000200002U000300002",
}

const SUGANG_SNU_BASEPATH = "http://sugang.snu.ac.kr/sugang/cc/cc100excel.action?";
function getSugangSnuQueryString(year:number, semester:number, lectureCategory:LectureCategory):string {
  let queryStrings: string[] = [
    "srchCond=1",
    "pageNo=1",
    "workType=EX",
    "sortKey=",
    "sortOrder=",
    "srchOpenSchyy="+year,
    "currSchyy="+year,
    "srchOpenShtm="+semesterQueryString[semester],
    "srchCptnCorsFg=",
    "srchOpenShyr=",
    "srchSbjtCd=",
    "srchSbjtNm=",
    "srchOpenUpSbjtFldCd=",
    "srchOpenUpDeptCd=",
    "srchOpenDeptCd=",
    "srchOpenMjCd=",
    "srchOpenSubmattFgCd=",
    "srchOpenPntMin=",
    "srchOpenPntMax=",
    "srchCamp=",
    "srchBdNo=",
    "srchProfNm=",
    "srchTlsnAplyCapaCntMin=",
    "srchTlsnAplyCapaCntMax=",
    "srchTlsnRcntMin=",
    "srchTlsnRcntMax=",
    "srchOpenSbjtTmNm=",
    "srchOpenSbjtTm=",
    "srchOpenSbjtTmVal=",
    "srchLsnProgType=",
    "srchMrksGvMthd=",
  ];
  if (lectureCategory !== null) queryStrings.push("srchOpenSbjtFldCd="+lectureCategory);
  if (lectureCategory === null) {
    logger.info("Fetching "+year+"-"+semesterString[semester]);
  } else {
    logger.info("Fetching " + lectureCategoryString[lectureCategory]);
  }
  return SUGANG_SNU_BASEPATH + queryStrings.join('&');
}

export type LectureLine = {
  classification: string,
  department: string,
  academic_year: string,
  course_number: string,
  lecture_number: string,
  course_title: string,
  credit: number,
  class_time: string,
  location: string,
  instructor: string,
  remark:string,
  category:string,
}

/**
 * @param times     "월(15:30~18:20)/목(17:00~17:50)"
 * @return          "월(7.5-3)/목(9-1)"
 */
function convertClassTime(times:string): string {
  const classTimeRegEx:RegExp = /(.)\((\d{2}):(\d{2})~(\d{2}):(\d{2})\)/g;
  let classTimes:string[] = times.split('/');
  let ret:string[] = [];
  for (let classTime of classTimes) {
    let error = false;
    let matchResult = classTimeRegEx.exec(classTime);
    if (matchResult != null) {
      logger.error("Parse error: " + classTime);
      continue;
    }

    let weekOfDay   = matchResult[0];
    let startHour   = parseInt(matchResult[1]);
    let startMinute = parseInt(matchResult[2]);
    let endHour     = parseInt(matchResult[3]);
    let endMinute   = parseInt(matchResult[4]);

    if (startMinute == 30) startHour += 0.5;
    else if (startMinute != 0) error = true;
    if (endMinute == 15 || endMinute == 20) endHour += 0.5;
    else if (endMinute == 45 || endMinute == 50) endHour += 1;
    else error = true;

    if (error) {
      logger.error("Parse error: " + classTime);
      continue;
    }
    ret.push(weekOfDay+"("+String(startHour)+"-"+String(endHour - startHour)+")");
  }
  return ret.join('/');
}

function getLineFromSheetAndRowIndex(sheet:xlsx.WorkSheet, i: number, lectureCategory: LectureCategory): LectureLine {
  let line: LectureLine;
  line.classification = sheet['A-'+i];
  // 교양 수업은 카테고리가 지정되어있을 때에만
  if (line.classification == "교양" && lectureCategory == null)
    return null;

  line.department = sheet['C-'+i];
  // 학과 정보가 없을 경우 단과 대학을 삽입
  if (line.department.length == 0)
    line.department = sheet['B-'+i];
  line.department.replace("null", ""); // null(과학교육계) 수정


  line.academic_year = sheet['D-'+i];
  if (line.academic_year == "학사") {
    line.academic_year = sheet['E-'+i];
    if (line.academic_year == "0")
      line.academic_year = ""
  }

  line.course_number = sheet['F-'+i];
  line.lecture_number = sheet['G-'+i];
  line.course_title = sheet['H-'+i];
  if (sheet['I-'+i].length > 0)
    line.course_title += " (" + sheet['I-'+i] + ")";
  
  line.credit = parseInt(sheet['J-'+i]);
  line.class_time = convertClassTime(sheet['M-'+i]);
  line.location = sheet['O-'+i];
  line.instructor = sheet['P-'+i];
  line.remark = sheet['S-'+i].replace('\n', ' ');
  line.category = lectureCategoryString[lectureCategory];
  return line;
}

function getExcelFile(year:number, semester: number, lectureCategory: LectureCategory): Promise<string> {
  return new Promise<string>(function(resolve, reject) {
    http.get({

    }, function(res) {
      resolve(res.body);
    })
  })
}

async function getExcelAndPush(destination:LectureLine[], year:number, semester:number, lectureCategory: LectureCategory): Promise<void> {
  let responseBody = http.get
  let responseBody = await request(getSugangSnuQueryString(year, semester, lectureCategory));
  if (responseBody == null || responseBody.length == 0) {
    logger.warn("No response");
    return;
  }
  logger.debug(responseBody);
  fs.writeFileSync("downloaded.xls", responseBody);
  let workbook = xlsx.read(responseBody, {type:"binary"});
  let sheet = workbook.Sheets[workbook.SheetNames[0]];
  let rowsize = sheet['!rows'].length;
  logger.debug(workbook.SheetNames[0] + ": " + rowsize + " rows");
  for (let i=4; i<=rowsize; i++) {
    let line = getLineFromSheetAndRowIndex(sheet, i, lectureCategory);
    if (line !== null) destination.push(line);
    if (i==4) logger.debug(String(line));
  }
}


/**
 * fetch.rb를 child process로 실행
 * @param year 
 * @param semester 
 */
export async function fetchSugangSnu(year:number, semester:number):Promise<LectureLine[]> {
  let ret: LectureLine[] = [];
  await getExcelAndPush(ret, year, semester, null);
  for(let type of lectureCategoryValues) {
    await getExcelAndPush(ret, year, semester, type);
  }
  return ret;
}
  