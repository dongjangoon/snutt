import request = require('request-promise-native');
import winston = require('winston');
import ExcelUtil = require('@app/batch/coursebook/excel/ExcelUtil');
import RefLecture from '@app/core/lecture/model/RefLecture';
import SugangSnuLectureService = require('@app/batch/coursebook/sugangsnu/SugangSnuLectureService');
import SugangSnuLectureCategoryService = require('@app/batch/coursebook/sugangsnu/SugangSnuLectureCategoryService');
let logger = winston.loggers.get('default');

const SEMESTER_1 = 1;
const SEMESTER_S = 2;
const SEMESTER_2 = 3;
const SEMESTER_W = 4;

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

export async function getRefLectureList(year: number, semester: number): Promise<RefLecture[]> {
    let ret: RefLecture[] = [];
    // apply의 경우 두번째 인자의 개수가 너무 많을 경우 fail할 수 있음
    ret.push.apply(ret, await getRefLectureListForCategory(year, semester, null));
    for (let category of SugangSnuLectureCategoryService.lectureCategoryList) {
        ret.push.apply(ret, await getRefLectureListForCategory(year, semester, category));
    }
    return ret;
}

async function getRefLectureListForCategory(year: number, semester: number, lectureCategory: number): Promise<RefLecture[]> {
    let fileBuffer: Buffer = await getCoursebookExcelFileForCategory(year, semester, lectureCategory);
    if (fileBuffer.byteLength == 0) {
        logger.info("No response");
        return [];
    }
    let sheet = ExcelUtil.getFirstSheetFromBuffer(fileBuffer);
    return SugangSnuLectureService.getRefLectureListFromExcelSheet(sheet, year, semester, lectureCategory);;
}

function getCoursebookExcelFileForCategory(year: number, semester: number, lectureCategory: number): Promise<Buffer> {
    return request.get(makeCoursebookExcelFileUrl(year, semester, lectureCategory), {
        encoding: null, // return as binary
        resolveWithFullResponse: true
    }).then(function(response: request.FullResponse) {
        if (response.statusCode >= 400) {
            logger.warn("status code " + response.statusCode);
            return Promise.resolve(new Buffer(0));
        }
        if (!response.headers["content-disposition"]) {
            logger.warn("No content-disposition found");
            return Promise.resolve(new Buffer(0));
        }
        return response.body;
    });
}

const SUGANG_SNU_BASEPATH = "http://sugang.snu.ac.kr/sugang/cc/cc100excel.action?";
function makeCoursebookExcelFileUrl(year: number, semester: number, lectureCategory: number): string {
    let queryStrings: string[] = [
        "srchCond=1",
        "pageNo=1",
        "workType=EX",
        "sortKey=",
        "sortOrder=",
        "srchOpenSchyy=" + year,
        "currSchyy=" + year,
        "srchOpenShtm=" + semesterQueryString[semester],
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
        logger.info("Fetching " + year + "-" + semesterString[semester]);
    } else {
        queryStrings.push("srchOpenSbjtFldCd=" + lectureCategory);
        logger.info("Fetching " + SugangSnuLectureCategoryService.getLectureCategoryString(lectureCategory));
    }
    let ret = SUGANG_SNU_BASEPATH + queryStrings.join('&');
    logger.debug(ret);
    return ret;
}
