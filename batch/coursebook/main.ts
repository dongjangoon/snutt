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


export async function insert_course(lines:Array<string>, year:number,
  semesterIndex:number, fcm_enabled:boolean): Promise<void>
{
  var semesterString = (['1', '여름', '2', '겨울'])[semesterIndex-1];
  var saved_cnt = 0, err_cnt = 0;
  var old_lectures: LectureDocument[];
  var new_lectures: LectureDocument[];
  var tags: TagStruct;
  var diff: LectureDiff;

  var noti_msg = year+"년도 "+semesterString+"학기 수강편람이 추가되었습니다.";

  console.log ("Loading new lectures...");
  var result = load_new_lectures(year, semesterIndex, lines);
  new_lectures = result.new_lectures;
  tags = result.tags;
  console.log("\nLoad complete with "+new_lectures.length+" courses");

  if (new_lectures.length == 0) {
    console.log("No lectures.");
    return;
  }

  console.log ("Pulling existing lectures...");
  old_lectures = <LectureDocument[]>await LectureModel.find({year : year, semester : semesterIndex}).lean().exec();

  console.log("Comparing existing lectures and new lectures...");
  diff = compare_lectures(old_lectures, new_lectures);
  if (diff.updated.length === 0 &&
      diff.created.length === 0 &&
      diff.removed.length === 0) {
    console.log("Nothing updated.");
    return;
  }

  console.log(diff.updated.length + " updated, "+
      diff.created.length + " created, "+
      diff.removed.length + " removed.");

  await notifyUpdated(year, semesterIndex, diff, fcm_enabled);

  await LectureModel.remove({ year: year, semester: semesterIndex}).exec();
  console.log("Removed existing lecture for this semester");

  console.log("Inserting new lectures...");
  var docs = await LectureModel.insertMany(new_lectures);
  console.log("\nInsert complete with " + docs.length + " success and "+ (new_lectures.length - docs.length) + " errors");

  await TagListModel.remove({ year: year, semester: semesterIndex}).exec();
  console.log("Removed existing tags");

  console.log("Inserting tags from new lectures...");
  for (var key in tags) {
    if (tags.hasOwnProperty(key)){
      tags[key].sort();
    }
  }
  var tagList = new TagListModel({
    year: Number(year),
    semester: semesterIndex,
    tags: tags,
    updated_at: Date.now()
  });
  await tagList.save();
  console.log("Inserted tags");

  console.log("saving coursebooks...");
  /* Send notification only when coursebook is new */
  var doc = await CourseBookModel.findOneAndUpdate({ year: Number(year), semester: semesterIndex },
    { updated_at: Date.now() },
    {
      new: false,   // return new doc
      upsert: true // insert the document if it does not exist
    })
    .exec();

  if (!doc) {
    if (fcm_enabled) await fcm.send_msg(null, noti_msg, "update_lectures.ts", "new coursebook");
    await NotificationModel.createNotification(null, noti_msg, NotificationType.COURSEBOOK, null, "unused");
    console.log("Notification inserted");
  }

  return;
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
