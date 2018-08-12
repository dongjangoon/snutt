import log4js = require('log4js');
import ExcelSheetWrapper from '@app/batch/coursebook/excel/model/ExcelSheetWrapper';
import SugangSnuLecture from './model/SugangSnuLecture';
import SugangSnuLectureCategoryService = require('@app/batch/coursebook/sugangsnu/SugangSnuLectureCategoryService');
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import RefLecture from '@app/core/lecture/model/RefLecture';
var logger = log4js.getLogger();

export function getRefLectureListFromExcelSheet(sheet: ExcelSheetWrapper, year: number, semester: number, lectureCategory: number): RefLecture[] {
    let ret: RefLecture[] = [];
    let rowsize = sheet.getRowSize();
    for (let i = 3; i < rowsize; i++) {
        let line = getSugangSnuLectureFromSheetRow(sheet, i);
        if (line !== null) {
            ret.push(getRefLectureFromSugangSnuLecture(year, semester, lectureCategory, line));
        }
    }
    return ret;
}

function getRefLectureFromSugangSnuLecture(year: number, semester: number, lectureCategory: number, sugangSnuLecture: SugangSnuLecture): RefLecture {
    // 교양 수업은 카테고리가 지정되어있을 때에만
    if (sugangSnuLecture.classification == "교양" && lectureCategory == null) {
        return null;
    }

    let department = sugangSnuLecture.department;
    // 학과 정보가 없을 경우 단과 대학을 삽입
    if (department.length == 0) {
        department = sugangSnuLecture.college;
    }
    department = department.replace("null", ""); // null(과학교육계) 수정

    let academic_year = sugangSnuLecture.academic_year;
    if (sugangSnuLecture.academic_course != "학사") {
        // 석박일 경우, 학년 탭에 석박사통합 / 석사 / 박사 여부를 표시
        academic_year = sugangSnuLecture.academic_course;
    }
    if (academic_year == "0") {
        academic_year = "";
    }

    let course_title = sugangSnuLecture.course_title;
    if (sugangSnuLecture.course_subtitle.length > 0)
        course_title += " (" + sugangSnuLecture.course_subtitle + ")";

    let credit = parseInt(sugangSnuLecture.credit);
    let quota = parseInt(sugangSnuLecture.quota.split(" ")[0]);
    
    let parsedClassTime = parseClassTime(sugangSnuLecture.class_time);
    let timeJson = TimePlaceUtil.timeAndPlaceToJson(parsedClassTime, sugangSnuLecture.location);
    if (timeJson === null) {
        logger.warn("timeJson not found from (" + sugangSnuLecture.class_time + ", " + sugangSnuLecture.location + ")");
    }
    // TimeMask limit is 15*2
    for (let j=0; j<timeJson.length; j++) {
      var t_end = timeJson[j].start+timeJson[j].len;
      if (t_end > 15) {
        logger.warn("("+sugangSnuLecture.course_number+", "+sugangSnuLecture.lecture_number+", "+sugangSnuLecture.course_number+
          ") ends at "+t_end);
      }
    }

    let class_time_mask = TimePlaceUtil.timeJsonToMask(timeJson);

    let category = "";
    if (lectureCategory) category = SugangSnuLectureCategoryService.getLectureCategoryString(lectureCategory);

    let classification = sugangSnuLecture.classification;
    let course_number = sugangSnuLecture.course_number;
    let lecture_number = sugangSnuLecture.lecture_number;
    let instructor = sugangSnuLecture.instructor;
    let remark = sugangSnuLecture.remark;
    
    return {
        year: year,
        semester: semester,
        classification: classification,
        department: department,
        academic_year: academic_year,
        course_number: course_number,
        lecture_number: lecture_number,
        course_title: course_title,
        credit: credit,
        class_time: parsedClassTime,
        class_time_json: timeJson,
        class_time_mask: class_time_mask,
        instructor: instructor,
        quota: quota,
        remark: remark,
        category: category
    }
}

/**
 * @param times     "월(15:30~18:20)/목(17:00~17:50)"
 * @return          "월(7.5-3)/목(9-1)"
 */
function parseClassTime(times:string): string {
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

function getSugangSnuLectureFromSheetRow(sheetWrap: ExcelSheetWrapper, i: number): SugangSnuLecture {
    return {
        // 교과구분
        classification: sheetWrap.getCell(i, 0),
        // 개설대학
        college: sheetWrap.getCell(i, 1),
        // 개설학과
        department: sheetWrap.getCell(i, 2),
        // 이수과정
        academic_course: sheetWrap.getCell(i, 3),
        // 학년
        academic_year: sheetWrap.getCell(i, 4),
        // 교과목 번호
        course_number: sheetWrap.getCell(i, 5),
        // 강좌 번호
        lecture_number: sheetWrap.getCell(i, 6),
        // 교과목명
        course_title: sheetWrap.getCell(i, 7),
        // 부제명
        course_subtitle: sheetWrap.getCell(i, 8),
        // 학점
        credit: sheetWrap.getCell(i, 9),
        // 강의
        num_lecture: sheetWrap.getCell(i, 10),
        // 실습
        num_practice: sheetWrap.getCell(i, 11),
        // 수업교시
        class_time: sheetWrap.getCell(i, 12),
        // 수업형태
        class_type: sheetWrap.getCell(i, 13),
        // 강의실
        location: sheetWrap.getCell(i, 14),
        // 주담당교수
        instructor: sheetWrap.getCell(i, 15),
        // 정원
        quota: sheetWrap.getCell(i, 16),
        // 수강신청인원
        enrollment: sheetWrap.getCell(i, 17),
        // 비고
        remark: sheetWrap.getCell(i, 18),
        // 강의 언어
        lecture_language: sheetWrap.getCell(i, 19),
        // 개설 상태
        lecture_status: sheetWrap.getCell(i, 20),
    };
}
