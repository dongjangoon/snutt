import * as xlsx from 'xlsx';
import * as http from 'http';
import * as request from 'request-promise-native';
import * as log4js from 'log4js';
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
function getSugangSnuEndPoint(year:number, semester:number, lectureCategory:LectureCategory):string {
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
  if (lectureCategory === null) {
    queryStrings.push("srchOpenSbjtFldCd=");
    logger.info("Fetching "+year+"-"+semesterString[semester]);
  } else {
    queryStrings.push("srchOpenSbjtFldCd="+lectureCategory);
    logger.info("Fetching " + lectureCategoryString[lectureCategory]);
  }
  let ret = SUGANG_SNU_BASEPATH + queryStrings.join('&');
  logger.debug(ret);
  return ret;
}

export class LectureLine {
  classification: string;
  department: string;
  academic_year: string;
  course_number: string;
  lecture_number: string;
  course_title: string;
  credit: number;
  class_time: string;
  location: string;
  instructor: string;
  remark:string;
  category:string;
}

class SheetWrapper {
  private sheet: xlsx.WorkSheet;
  constructor (sheet: xlsx.WorkSheet) {
    this.sheet = sheet;
  }

  getRowSize(): number {
    return xlsx.utils.decode_range(this.sheet['!ref']).e.r;
  }

  getCell(r: number, c: number): string {
    let obj:xlsx.CellObject = this.sheet[xlsx.utils.encode_cell({r: r, c: c})];
    return <string>obj.v;
  }
}

/**
 * @param times     "월(15:30~18:20)/목(17:00~17:50)"
 * @return          "월(7.5-3)/목(9-1)"
 */
function convertClassTime(times:string): string {
  const classTimeRegEx:RegExp = /(월|화|수|목|금|토|일)\((\d{2}):(\d{2})~(\d{2}):(\d{2})\)/;
  let classTimes:string[] = times.split('/');
  let ret:string[] = [];
  for (let classTime of classTimes) {
    if (classTime.length == 0) continue;
    let error = false;
    let matchResult = classTimeRegEx.exec(classTime);
    if (matchResult === null) {
      logger.error("Parse error: " + classTime);
      continue;
    }

    let weekOfDay   = matchResult[1];
    let startHour   = parseInt(matchResult[2])-8;
    let startMinute = parseInt(matchResult[3]);
    let endHour     = parseInt(matchResult[4])-8;
    let endMinute   = parseInt(matchResult[5]);

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

function getLineFromSheetAndRowIndex(sheetWrap: SheetWrapper, i: number, lectureCategory: LectureCategory): LectureLine {
  let line: LectureLine = new LectureLine();
  line.classification = sheetWrap.getCell(i, 0);
  // 교양 수업은 카테고리가 지정되어있을 때에만
  if (line.classification == "교양" && lectureCategory == null)
    return null;

  line.department = sheetWrap.getCell(i, 2);
  // 학과 정보가 없을 경우 단과 대학을 삽입
  if (line.department.length == 0)
    line.department = sheetWrap.getCell(i, 1);
  line.department = line.department.replace("null", ""); // null(과학교육계) 수정


  line.academic_year = sheetWrap.getCell(i, 3);
  if (line.academic_year == "학사") {
    line.academic_year = sheetWrap.getCell(i, 4);
    if (line.academic_year == "0")
      line.academic_year = ""
  }

  line.course_number = sheetWrap.getCell(i, 5);;
  line.lecture_number = sheetWrap.getCell(i, 6);;
  line.course_title = sheetWrap.getCell(i, 7);;
  if (sheetWrap.getCell(i, 8).length > 0)
    line.course_title += " (" + sheetWrap.getCell(i, 8); + ")";
  
  line.credit = parseInt(sheetWrap.getCell(i, 9));
  line.class_time = convertClassTime(sheetWrap.getCell(i, 12));
  line.location = sheetWrap.getCell(i, 14);
  line.instructor = sheetWrap.getCell(i, 15);
  line.remark = sheetWrap.getCell(i, 18);
  if (lectureCategory) line.category = lectureCategoryString[lectureCategory];
  else line.category = "";
  return line;
}

function getExcelFile(year:number, semester: number, lectureCategory: LectureCategory): Promise<Buffer> {
  return new Promise<Buffer>(function(resolve, reject) {
    http.get(getSugangSnuEndPoint(year, semester, lectureCategory), 
    function(res) {
      if (res.statusCode != 200) {
        logger.warn("status code "+res.statusCode);
        return resolve(new Buffer(0));
      }
      
      var data = [];
      res.on('data', function(chunk) {
        data.push(chunk);
      }).on('end', function() {
        var buffer = Buffer.concat(data);
        resolve(buffer);
      })
    }).on("error", function(err) {
      reject(err);
    });
  })
}

async function getExcelAndPush(destination:LectureLine[], year:number, semester:number, lectureCategory: LectureCategory): Promise<void> {
  let fileBuffer:Buffer = await getExcelFile(year, semester, lectureCategory);
  if (fileBuffer.byteLength == 0) {
    logger.info("No response");
    return;
  }
  let workbook = xlsx.read(fileBuffer, {type:"buffer"});
  let sheet = workbook.Sheets[workbook.SheetNames[0]];
  let sheetWrap = new SheetWrapper(sheet);
  let rowsize = sheetWrap.getRowSize();
  logger.debug(workbook.SheetNames[0] + ": " + rowsize + " rows");
  for (let i=4; i<=rowsize; i++) {
    let line = getLineFromSheetAndRowIndex(sheetWrap, i, lectureCategory);
    if (line !== null) destination.push(line);
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
  