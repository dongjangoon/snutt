import express = require('express');
var router = express.Router();
import errcode = require('@app/api/errcode');
import RefLectureQueryService = require('@app/core/lecture/RefLectureQueryService');
import * as log4js from 'log4js';
import InvalidLectureTimemaskError from '@app/core/lecture/error/InvalidLectureTimemaskError';
var logger = log4js.getLogger();

router.post('/', async function(req, res, next) {
  if (!req.body.year || !req.body.semester) {
    return res.status(400).json({errcode:errcode.NO_YEAR_OR_SEMESTER, message: 'no year and semester'});
  }

  var query: any = req.body;
  try {
    RefLectureQueryService.addQueryLogAsync(query);
    var lectures = await RefLectureQueryService.extendedSearch(query);
    return res.json(lectures);
  } catch (err) {
    if (err instanceof InvalidLectureTimemaskError) {
      return res.status(400).json({errcode:errcode.INVALID_TIMEMASK, message: "invalid timemask"});
    }
    logger.error(err);
    return res.status(500).json({errcode:errcode.SERVER_FAULT, message: "search error"});
  }
});

export = router;