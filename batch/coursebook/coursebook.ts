/**
 * fetch.rb로부터 긁어온 txt 파일을 읽어 몽고 디비에 입력합니다.
 * $ node import_txt 2016 1
 * 
 * @author Hyeungshik Jung, zxzl@github
 * @author Jang Ryeol, ryeolj5911@gmail.com
 */

const db = require('../db');
import fs = require('fs');
import {insert_course} from './data/parse';
import {fetchSugangSnu} from './data/fetch';
import {CourseBookModel} from '../../model/courseBook';


/**
 * String을 읽어 몽고 디비에 입력합니다.
 * Mocha 테스트를 위해 export 됩니다.
 * 파일로부터 읽으려면 {@link importFromFile}를 호출하여
 * 먼저 String으로 변환합니다.
 * 
 * @param str_txt 
 * @param year 
 * @param semester 
 * @param fcm_enabled 
 */
export async function importFromString(str_txt:string, year:number, semester:string,
    fcm_enabled:boolean):Promise<void> {
	var lines = str_txt.split("\n");
	var header = lines.slice(0, 3);
	var courses = lines.slice(3);

	if ((year && year != parseInt(header[0].split("/")[0].trim())) ||
			(semester && semester != header[0].split("/")[1].trim())) {
		return Promise.reject("Textfile does not match with given parameter");
	}
	var semesterIndex = ['1', 'S', '2', 'W'].indexOf(semester) + 1;
	await insert_course(courses, year, semesterIndex, fcm_enabled);
	return;
}

/**
 * 해당 연도와 학기로부터 파일을 읽은 후, {@link importFromString}을 호출합니다.
 * 
 * @param year
 * @param semester 
 * @param fcm_enabled 		Firebase 메세지를 전송할 지 여부
 */
export function importFromFile(year:number, semester:string, fcm_enabled:boolean):Promise<void> {
	var datapath = __dirname + "/txt/"+year+"_"+semester+".txt";
	return new Promise<void>(function(resolve, reject) {
		fs.readFile(datapath, function (err, data) {
			if (err) {
				return reject(err);
			}
			return importFromString(data.toString(), year, semester, fcm_enabled).then(function(result) {
				resolve(result);
			}).catch(function(reason) {
				reject(reason);
			});
		});
	});
}

function semesterToString(semester:number):string {
  switch(semester) {
    case 1:
    return '1';
    case 2:
    return 'S';
    case 3:
    return '2';
    case 4:
    return 'W';
    default:
    return '?';
  }
}

/**
 * 현재 수강편람과 다음 수강편람
 */
async function getUpdateCandidate():Promise<[[number, string]]> {
  try {
    let recentCoursebook = await CourseBookModel.getRecent();
    let year = recentCoursebook.year;
    let semester = recentCoursebook.semester;

    let nextYear = year;
    let nextSemester = semester + 1;
    if (nextSemester > 4) {
      nextYear++;
      nextSemester = 0;
    }

    return [[year, semesterToString(semester)],
    [nextYear, semesterToString(nextSemester)]];
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  let cands = await getUpdateCandidate();
  for (let i=0; i<cands.length; i++) {
    let year = cands[i][0];
    let semester = cands[i][1];
    try {
      await fetchSugangSnu(year, semester);
      await importFromFile(year, semester, true);
    } catch (err) {
      console.error(err);
      console.log("Failed");
      continue;
    }
  }
  process.exit(0);  
}

if (!module.parent) {
  main();
}
