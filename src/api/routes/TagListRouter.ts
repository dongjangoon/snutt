/**
 * Created by north on 16. 2. 24.
 */
import ExpressPromiseRouter from 'express-promise-router';
var router = ExpressPromiseRouter();
import TagListService = require('@app/core/taglist/TagListService');
import * as log4js from 'log4js';
import TagListNotFoundError from '@app/core/taglist/error/TagListNotFoundError';
import { restGet } from '../decorator/RestDecorator';
import ApiError from '../error/ApiError';
import ErrorCode from '../enum/ErrorCode';
var logger = log4js.getLogger();

restGet(router, '/:year/:semester/update_time')(async function(context, req) {
  try {
    let updateTime = await TagListService.getUpdateTimeBySemester(req.params.year, req.params.semester);
    return {updated_at: updateTime};
  } catch (err) {
    if (err instanceof TagListNotFoundError) {
      throw new ApiError(404, ErrorCode.TAG_NOT_FOUND, "not found");
    } else {
      throw err;
    } 
  }
});

restGet(router, '/:year/:semester/')(async function(context, req) {
  let doc = await TagListService.getBySemester(req.params.year, req.params.semester);
  if (!doc) {
    throw new ApiError(404, ErrorCode.TAG_NOT_FOUND, "not found");
  }
  return {
    classification : doc.tags.classification,
    department : doc.tags.department,
    academic_year : doc.tags.academic_year,
    credit : doc.tags.credit,
    instructor : doc.tags.instructor,
    category : doc.tags.category,
    updated_at : doc.updated_at
  };
});

export = router;