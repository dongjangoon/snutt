import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');

export function compareLecture(oldl, newl) {
  var updated = {
    before:{},
    after:{}
  };
  var keys = [
    'classification',
    'department',
    'academic_year',
    'course_title',
    'credit',
    'instructor',
    'quota',
    //'enrollment',
    'remark',
    'category'
    ];
  for (var i=0; i<keys.length; i++) {
    if (oldl[keys[i]] != newl[keys[i]]) {
      updated.before[keys[i]] = oldl[keys[i]];
      updated.after[keys[i]] = newl[keys[i]];
    }
  }

  if (!TimePlaceUtil.equalTimeJson(oldl.class_time_json, newl.class_time_json)) {
    updated.before["class_time_json"] = oldl.class_time_json;
    updated.after["class_time_json"] = newl.class_time_json;
  }

  if (Object.keys(updated.after).length === 0) updated = null;
  return updated;
};

var re = /#[0-9A-Fa-f]{6}/g;
export function isColor(colorString:string):boolean {
  var result = re.test(colorString);
  re.lastIndex = 0;
  return result;
}
