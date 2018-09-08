/**
 * API 기능 목적의 라우터 엔트리
 * {@link config/apiKey}의 API 키가 필수
 * 각 라우터의 input과 ouput은 위키 참조
 */

import express = require('express');

var router = express.Router();

import CourseBookService = require('@app/core/coursebook/CourseBookService');

import AuthRouter = require('./AuthRouter');
import TimetableRouter = require('./TimetableRouter');
import SearchQueryRouter = require('./SearchQueryRouter');
import TagListRouter = require('./TagListRouter');
import NotificationRouter = require('./NotificationRouter');
import UserRouter = require('./UserRouter');
import AdminRouter = require('./AdminRouter');
import apiKey = require('@app/core/config/apiKey');
import UserService = require('@app/core/user/UserService');
import FeedbackService = require('@app/core/feedback/FeedbackService');
import LectureColorService = require('@app/core/timetable/LectureColorService');
import SugangSnuSyllabusService = require('@app/core/coursebook/sugangsnu/SugangSnuSyllabusService')

import * as log4js from 'log4js';
import RequestContext from '../model/RequestContext';
import { restGet, restPost } from '../decorator/RestDecorator';
import ErrorCode from '../enum/ErrorCode';
import ApiError from '../error/ApiError';
var logger = log4js.getLogger();

router.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  req['context'] = {};
  next();
});

router.get('/terms_of_service', function(req, res, next) {
  res.render('terms_of_service.html');
});

router.get('/privacy_policy', function(req, res, next) {
  res.render('privacy_policy.html');
});

router.get('/member', function(req, res, next) {
  res.render('member.html');
});

var api_info;

/**
 * Check API Key
 */
router.use(function(req, res, next) {
  var token = <string>req.headers['x-access-apikey'];
  let context: RequestContext = req['context'];
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  apiKey.validateKey(token).then(function(platform){
    context.platform = platform;
    next();
  }, function(err) {
    res.status(403).json({errcode: ErrorCode.WRONG_API_KEY, message: err});
  });
});

restGet(router, '/course_books')(CourseBookService.getAll);

restGet(router, '/course_books/recent')(CourseBookService.getRecent);

restGet(router, '/course_books/official')(async function(context, req) {
  var year = req.query.year;
  var semester = Number(req.query.semester);
  var lecture_number = req.query.lecture_number;
  var course_number = req.query.course_number;
  return {
    url: SugangSnuSyllabusService.getSyllabusUrl(year, semester, lecture_number, course_number)
  };
});

router.use('/search_query', SearchQueryRouter);

router.use('/tags', TagListRouter);

restGet(router, '/colors')(async function(context, req) {
  return {message: "ok", colors: LectureColorService.getLegacyColors(), names: LectureColorService.getLegacyNames()};
});

restGet(router, '/colors/:colorName')(async function(context, req) {
  let colorWithName = LectureColorService.getColorList(req.params.colorName);
  if (colorWithName) return {message: "ok", colors: colorWithName.colors, names: colorWithName.names};
  else throw new ApiError(404, ErrorCode.COLORLIST_NOT_FOUND, "color list not found");
});

restGet(router, '/app_version')(async function() {
  var version = apiKey.getAppVersion(api_info.string);
  if (version) return {version: version};
  else throw new ApiError(404, ErrorCode.UNKNOWN_APP, "unknown app");
});

restPost(router, '/feedback')(async function(context, req) {
  await FeedbackService.add(req.body.email, req.body.message, req["api_platform"]);
  return {message:"ok"};
});

router.use('/auth', AuthRouter);

/**
 * Token Authenticator
 * Checks if the user is logged in
 * Which means all routers below this need authentication
 */
router.use(function(req, res, next) {
  let context: RequestContext = req['context'];
  var token = req.query.token || req.body.token || req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({
      errcode: ErrorCode.NO_USER_TOKEN,
      message: 'No token provided.'
    });
  }
  UserService.getByCredentialHash(token).then(function(user){
    if (!user)
      return res.status(403).json({ errcode: ErrorCode.WRONG_USER_TOKEN, message: 'Failed to authenticate token.' });
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    UserService.updateLastLoginTimestamp(user);
    context.user = user;
    next();
  }, function (err) {
    logger.error(err);
    return res.status(403).json({ errcode: ErrorCode.WRONG_USER_TOKEN, message: 'Failed to authenticate token.' });
  });
});

router.use('/tables', TimetableRouter);

router.use('/user', UserRouter);

router.use('/notification', NotificationRouter);

router.use('/admin', AdminRouter);

export = router;
