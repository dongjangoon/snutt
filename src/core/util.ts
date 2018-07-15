import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import { List } from 'immutable';
import * as log4js from 'log4js';
var logger = log4js.getLogger();

function deleteObjectIdRecur(obj: any, stack: List<object>) {
  for (let i=0; i< stack.size; i++) {
    if (i > 10) {
      logger.warn("deleteObjectIdRecur: Too deep stack");
      logger.warn(obj);
      return;
    }
    if (obj === stack[i]) {
      logger.warn("deleteObjectIdRecur: recurrence found");
      logger.warn(obj);
      return;
    }
  }
  if (obj !== null && typeof(obj) == 'object') {
    if (obj instanceof Promise) {
      logger.warn("deleteObjectIdRecur: Object is promise");
    } else if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i] && obj[i]._id) deleteObjectIdRecur(obj[i], stack.push(obj));  //recursive del calls on array elements
      }
    } else {
      delete obj._id;
      Object.keys(obj).forEach(function(key) {
        if (obj[key] && obj[key]._id) deleteObjectIdRecur(obj[key], stack.push(obj)); //recursive del calls on object elements
      });
    }
  }
}

/**
 * Delete '_id' prop of the object and its sub-object recursively
 * This is for copying mongo objects or sanitizing json objects by removing all _id properties
 */
export function deleteObjectId(object) {
  return deleteObjectIdRecur(object, List<object>());
};

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
