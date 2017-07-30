/**
 * 메인 라우터 엔트리
 * 약관과 개발자 정보 등 html 컨텐츠와
 * API 모듈이 분리되어 있음.
 */

import express = require('express');
var router = express.Router();

import apiRouter = require('./api/api');

router.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
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

router.use('/', apiRouter);

export = router;