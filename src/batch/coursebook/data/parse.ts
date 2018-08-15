import RefLecture from '@app/core/lecture/model/RefLecture';
import TagListEtcTagService = require('@app/core/taglist/TagListEtcTagService');
import * as log4js from 'log4js';
var logger = log4js.getLogger();

export type TagStruct = {
  classification : string[],
  department : string[],
  academic_year : string[],
  credit : string[],
  instructor : string[],
  category : string[],
  etc: string[]
};

export function parseTagFromLectureList(lines:RefLecture[]): TagStruct {
  var tags: TagStruct = {
    classification : [],
    department : [],
    academic_year : [],
    credit : [],
    instructor : [],
    category : [],
    etc: TagListEtcTagService.getEtcTagList()
  };
  for (let i=0; i<lines.length; i++) {
    var line = lines[i];

    var new_tag = {
      classification : line.classification,
      department : line.department,
      academic_year : line.academic_year,
      credit : line.credit+'학점',
      instructor : line.instructor,
      category : line.category
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
            console.log(line);
          }
          if (new_tag[key].length < 2) continue;
          tags[key].push(new_tag[key]);
        }
      }
    }
  }

  return tags;
}
