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
    // lectureCategory = null일 경우 getRefLectureListForCategory 안에서 교양 영역 강좌는 필터링
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
    return request.post(makeCoursebookExcelFileUrl(year, semester, lectureCategory), {
        encoding: null, // return as binary
        resolveWithFullResponse: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36",
            "Referrer": "https://sugang.snu.ac.kr/sugang/cc/cc100InterfaceExcel.action"
        }
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

const SUGANG_SNU_BASEPATH = "https://sugang.snu.ac.kr/sugang/cc/cc100InterfaceExcel.action?";
function makeCoursebookExcelFileUrl(year: number, semester: number, lectureCategory: number): string {
    let params = {
        workType: "EX",
        srchOpenSchyy: 2020,
        srchOpenShtm: semesterQueryString[semester],
        srchSbjtNm: "",
        srchSbjtCd: "",
        seeMore: "더보기",
        srchCptnCorsFg: "",
        srchOpenShyr: "",
        srchOpenUpSbjtFldCd: "", 
        srchOpenUpDeptCd: "",
        srchOpenDeptCd: "",
        srchOpenMjCd: "",
        srchOpenSubmattCorsFg: "",
        srchOpenSubmattFgCd1: "",
        srchOpenSubmattFgCd2: "",
        srchOpenSubmattFgCd3: "",
        srchOpenSubmattFgCd4: "",
        srchOpenSubmattFgCd5: "",
        srchOpenSubmattFgCd6: "",
        srchOpenSubmattFgCd7: "",
        srchOpenSubmattFgCd8: "",
        srchExcept: "",
        srchOpenPntMin: "", 
        srchOpenPntMax: "",
        srchCamp: "",
        srchBdNo: "",
        srchProfNm: "",
        srchOpenSbjtTmNm: "", 
        srchOpenSbjtDayNm: "",
        srchOpenSbjtTm: "",
        srchOpenSbjtNm: "",
        srchTlsnAplyCapaCntMin: "", 
        srchTlsnAplyCapaCntMax: "",
        srchLsnProgType: "",
        srchTlsnRcntMin: "",
        srchTlsnRcntMax: "",
        srchMrksGvMthd: "",
        srchIsEngSbjt: "",
        srchIsAplyAvailable: "",
        srchMrksApprMthdChgPosbYn: "", 
        srchLanguage: "ko",
        srchCurrPage: 1,
        srchPageSize: 9999,
    }

    if (lectureCategory === null) {
        params["srchOpenSbjtFldCd"] = "";
        logger.info("Fetching " + year + "-" + semesterString[semester]);
    } else {
        params["srchOpenSbjtFldCd"] = lectureCategory;
        logger.info("Fetching " + SugangSnuLectureCategoryService.getLectureCategoryString(lectureCategory));
    }
    
    let retarr = [];
    for (let key in params) {
        retarr.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
    let ret = SUGANG_SNU_BASEPATH + retarr.join('&');
    logger.debug(ret);
    return ret;
}
