/**
 * Created by north on 16. 2. 24.
 */
import express = require('express');
var router = express.Router();
import {TagList} from '@app/core/model/tagList';
import errcode = require('@app/api/errcode');
import * as log4js from 'log4js';
var logger = log4js.getLogger();

router.get('/:year/:semester/update_time', async function(req, res, next) {
  try {
    let updateTime = await TagList.getUpdateTime(req.params.year, req.params.semester);
    res.json({updated_at: updateTime});
  } catch (err) {
    if (err === errcode.TAG_NOT_FOUND) {
      return res.status(404).json({errcode: errcode.TAG_NOT_FOUND, message: 'not found'});
    } else {
      logger.error(err);
      return res.status(500).json({errcode: errcode.SERVER_FAULT, message: 'unknown error'});
    } 
  }
});

router.get('/:year/:semester/', async function(req, res, next) {
  try {
    let doc = await TagList.findBySemester(req.params.year, req.params.semester);
    if (!doc) return res.status(404).json({errcode: errcode.TAG_NOT_FOUND, message: 'not found'});
    var ret = {
      classification : doc.tags.classification,
      department : doc.tags.department,
      academic_year : doc.tags.academic_year,
      credit : doc.tags.credit,
      instructor : doc.tags.instructor,
      category : doc.tags.category,
      updated_at : doc.updated_at
    };
    res.json(ret);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message: 'unknown error'});
  }
});

export = router;