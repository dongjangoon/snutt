import express = require('express');
var router = express.Router();

import TimetableService = require('@app/core/timetable/TimetableService');
import TimetableLectureService = require('@app/core/timetable/TimetableLectureService');
import User from '@app/core/user/model/User';
import errcode = require('@app/api/errcode');
import * as log4js from 'log4js';
import DuplicateTimetableTitleError from '@app/core/timetable/error/DuplicateTimetableTitleError';
import DuplicateLectureError from '@app/core/timetable/error/DuplicateLectureError';
import LectureTimeOverlapError from '@app/core/timetable/error/LectureTimeOverlapError';
import RefLectrureNotFoundError from '@app/core/lecture/error/RefLectureNotFoundError';
import WrongRefLectureSemesterError from '@app/core/timetable/error/WrongRefLectureSemesterError';
import InvalidLectureTimemaskError from '@app/core/lecture/error/InvalidLectureTimemaskError';
import InvalidLectureColorError from '@app/core/timetable/error/InvalidLectureColorError';
import InvalidLectureColorIndexError from '@app/core/timetable/error/InvalidLectureColorIndexError';
import InvalidLectureUpdateRequestError from '@app/core/timetable/error/InvalidLectureUpdateRequestError';
import NotCustomLectureError from '@app/core/timetable/error/NotCustomLectureError';
import CustomLectureResetError from '@app/core/timetable/error/CusromLectureResetError';
import UserLectureNotFoundError from '@app/core/timetable/error/UserLectureNotFoundError';
import TimetableNotFoundError from '@app/core/timetable/error/TimetableNotFoundError';
import InvalidLectureTimeJsonError from '@app/core/lecture/error/InvalidLectureTimeJsonError';
var logger = log4js.getLogger();

router.get('/', async function(req, res, next) { //timetable list
  var user:User = <User>req["user"];
  try {
    let result = await TimetableService.getAbstractListByUserId(user._id);
    res.json(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:'fetch timetable list failed'});
  }
});

router.get('/recent', async function(req, res, next) {
  var user:User = <User>req["user"];
  try {
    let result = await TimetableService.getRecentByUserId(user._id);
    if (!result) res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:'no timetable'});
    else res.json(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:'find table failed'});
  }
});

router.get('/:id', async function(req, res, next) { //get
  var user:User = <User>req["user"];
  try {
    let result = await TimetableService.getByMongooseId(user._id, req.params.id);
    if (!result) res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:'timetable not found'});
    else res.json(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"find table failed"});
  }
});

router.get('/:year/:semester', async function(req, res, next) {
  var user:User = <User>req["user"];
  try {
    let result = await TimetableService.getBySemester(user._id, req.params.year, req.params.semester);
    if (!result) res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:"No timetable for given semester"});
    else res.json(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"find table failed"});
  }
});

router.post('/', async function(req, res, next) { //create
  var user:User = <User>req["user"];
  if (!req.body.year || !req.body.semester || !req.body.title)
    return res.status(400).json({errcode: errcode.NOT_ENOUGH_TO_CREATE_TIMETABLE, message:'not enough parameters'});

  try {
    await TimetableService.addFromParam({
      user_id : user._id,
      year : req.body.year,
      semester : req.body.semester,
      title : req.body.title
    });

    let tableList = await TimetableService.getAbstractListByUserId(user._id);
    res.json(tableList);
  } catch (err) {
    if (err instanceof DuplicateTimetableTitleError) {
      return res.status(403).json({errcode: errcode.DUPLICATE_TIMETABLE_TITLE, message: err});
    }
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:'server fault'});
  }
});

/**
 * POST /tables/:timetable_id/lecture/:lecture_id
 * add a lecture into a timetable
 * param ===================================
 * Lecture id from search query
 */
router.post('/:timetable_id/lecture/:lecture_id', async function(req, res, next) {
  var user:User = <User>req["user"];
  try {
    let table = await TimetableService.getByMongooseId(user._id, req.params.timetable_id);
    if (!table) return res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    
    await TimetableLectureService.addRefLecture(table, req.params.lecture_id);
    res.json(await TimetableService.getByMongooseId(user._id, req.params.timetable_id));
  } catch (err) {
    if (err instanceof DuplicateLectureError)
      return res.status(403).json({errcode: errcode.DUPLICATE_LECTURE, message:"duplicate lecture"});
    else if (err instanceof LectureTimeOverlapError)
      return res.status(403).json({errcode: errcode.LECTURE_TIME_OVERLAP, message:"lecture time overlap"});
    else if (err instanceof RefLectrureNotFoundError)
      return res.status(404).json({errcode: errcode.REF_LECTURE_NOT_FOUND, message:"ref lecture not found"});
    else if (err instanceof WrongRefLectureSemesterError)
      return res.status(403).json({errcode: errcode.WRONG_SEMESTER, message:"wrong semester"});

    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"insert lecture failed"});
  }
});

/**
 * POST /tables/:id/lecture
 * add a lecture into a timetable
 * param ===================================
 * json object of lecture to add
 */
router.post('/:id/lecture', async function(req, res, next) {
  var user:User = <User>req["user"];
  try {
    let table = await TimetableService.getByMongooseId(user._id, req.params.id);
    if (!table) return res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    await TimetableLectureService.addCustomLecture(table, req.body);
    res.json(await TimetableService.getByMongooseId(user._id, req.params.id));
  } catch (err) {
    if (err instanceof InvalidLectureTimemaskError)
      return res.status(403).json({errcode: errcode.INVALID_TIMEMASK, message:"invalid timemask"});
    if (err instanceof InvalidLectureTimeJsonError)
      return res.status(400).json({errcode: errcode.INVALID_TIMEJSON, message:"invalid timejson"});
    if (err instanceof DuplicateLectureError)
      return res.status(403).json({errcode: errcode.DUPLICATE_LECTURE, message:"duplicate lecture"});
    if (err instanceof LectureTimeOverlapError)
      return res.status(403).json({errcode: errcode.LECTURE_TIME_OVERLAP, message:"lecture time overlap"});
    if (err instanceof InvalidLectureColorError)
      return res.status(400).json({errcode: errcode.INVALID_COLOR, message:"invalid color"});
    if (err instanceof InvalidLectureColorIndexError)
      return res.status(400).json({errcode: errcode.INVALID_COLOR, message:"invalid color"});
    if (err instanceof InvalidLectureUpdateRequestError)
      return res.status(400).json({errcode: errcode.NO_LECTURE_TITLE, message:"no lecture title"});
    if (err instanceof NotCustomLectureError)
      return res.status(403).json({errcode: errcode.NOT_CUSTOM_LECTURE, message:"only custom lectures allowed"});
    if (err instanceof WrongRefLectureSemesterError)
      return res.status(403).json({errcode: errcode.WRONG_SEMESTER, message:"wrong semester"});
    logger.error(err)
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"insert lecture failed"});
  }
});

/**
 * PUT /tables/:table_id/lecture/:lecture_id
 * update a lecture of a timetable
 * param ===================================
 * json object of lecture to update
 */

router.put('/:table_id/lecture/:lecture_id', async function(req, res, next) {
  var user:User = <User>req["user"];
  var rawLecture = req.body;
  if(!rawLecture) return res.status(400).json({errcode: errcode.NO_LECTURE_INPUT, message:"empty body"});

  if (!req.params.lecture_id)
    return res.status(400).json({errcode: errcode.NO_LECTURE_ID, message:"need lecture_id"});

  try {
    let table = await TimetableService.getByMongooseId(user._id, req.params.table_id);
    if (!table) return res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});

    rawLecture._id = req.params.lecture_id;
    await TimetableLectureService.partialModifyUserLecture(user._id, table._id, rawLecture);
    res.json(await TimetableService.getByMongooseId(user._id, req.params.table_id));
  } catch (err) {
    if (err instanceof InvalidLectureTimemaskError)
      return res.status(400).json({errcode: errcode.INVALID_TIMEMASK, message:"invalid timemask"});
    if (err instanceof InvalidLectureTimeJsonError)
      return res.status(400).json({errcode: errcode.INVALID_TIMEJSON, message:"invalid timejson"});
    if (err instanceof LectureTimeOverlapError)
      return res.status(403).json({errcode: errcode.LECTURE_TIME_OVERLAP, message:"lecture time overlapped"});
    if (err instanceof InvalidLectureUpdateRequestError)
      return res.status(403).json({errcode: errcode.ATTEMPT_TO_MODIFY_IDENTITY, message:"modifying identities forbidden"})
    if (err instanceof InvalidLectureColorError)
      return res.status(400).json({errcode: errcode.INVALID_COLOR, message:"invalid color"})
    if (err instanceof InvalidLectureColorIndexError)
      return res.status(400).json({errcode: errcode.INVALID_COLOR, message:"invalid color"})
    if (err instanceof UserLectureNotFoundError)
      return res.status(404).json({errcode: errcode.LECTURE_NOT_FOUND, message:"lecture not found"});
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
  }
});

router.put('/:table_id/lecture/:lecture_id/reset', async function(req, res, next) {
  var user:User = <User>req["user"];

  if (!req.params.lecture_id)
    return res.status(400).json({errcode: errcode.NO_LECTURE_ID, message:"need lecture_id"});

  try {
    let table = await TimetableService.getByMongooseId(user._id, req.params.table_id);
    if (!table) return res.status(404).json({errcode:errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    await TimetableLectureService.resetLecture(user._id, table._id, req.params.lecture_id);
    res.json(await TimetableService.getByMongooseId(user._id, req.params.table_id));
  } catch (err) {
    if (err instanceof CustomLectureResetError) {
      return res.status(403).json({errcode: errcode.IS_CUSTOM_LECTURE, message:"cannot reset custom lectures"});
    } else if (err instanceof RefLectrureNotFoundError) {
      return res.status(404).json({errcode: errcode.REF_LECTURE_NOT_FOUND, message:"ref lecture not found"});
    } else if (err instanceof UserLectureNotFoundError) {
      return res.status(404).json({errcode: errcode.LECTURE_NOT_FOUND, message:"lecture not found"});
    } else if (err instanceof LectureTimeOverlapError) {
      return res.status(403).json({errcode: errcode.LECTURE_TIME_OVERLAP, message:"lecture time overlap"});
    } else {
      logger.error(err);
      return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"reset lecture failed"});
    }
  }
});

/**
 * DELETE /tables/:table_id/lecture/:lecture_id
 * delete a lecture from a timetable
 */
router.delete('/:table_id/lecture/:lecture_id', async function(req, res, next) {
  var user:User = <User>req["user"];
  try {
    await TimetableLectureService.removeLecture(user._id, req.params.table_id, req.params.lecture_id);
    let table = await TimetableService.getByMongooseId(user._id, req.params.table_id);
    res.json(table);
  } catch (err) {
    if (err instanceof TimetableNotFoundError) 
      return res.status(404).json({errcode:errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    logger.error(err);
    return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"delete lecture failed"});
  }
});

/**
 * DELETE /tables/:id
 * delete a timetable
 */
router.delete('/:id', async function(req, res, next) { // delete
  var user:User = <User>req["user"];
  try {
    await TimetableService.remove(user._id, req.params.id);
    let tableList = await TimetableService.getAbstractListByUserId(user._id);
    res.json(tableList);
  } catch (err) {
    if (err instanceof TimetableNotFoundError) 
      return res.status(404).json({errcode:errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    logger.error(err);
    return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"delete timetable failed"});
  }
});

/**
 * POST /tables/:id/copy
 * copy a timetable
 */
router.post('/:id/copy', async function(req, res, next) {
  var user:User = <User>req["user"];
  try {
    let table = await TimetableService.getByMongooseId(user._id, req.params.id);
    if (!table) return res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    await TimetableService.copy(table);
    let tableList = await TimetableService.getAbstractListByUserId(user._id);
    res.json(tableList);
  } catch (err) {
    logger.error("/:id/copy ", err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"copy table failed"});
  }
});

router.put('/:id', async function(req, res, next) {
  var user:User = <User>req["user"];
  if (!req.body.title) return res.status(400).json({errcode: errcode.NO_TIMETABLE_TITLE, message:"should provide title"});
  
  try {
    await TimetableService.modifyTitle(req.params.id, user._id, req.body.title);
    let tableList = await TimetableService.getAbstractListByUserId(user._id);
    res.json(tableList);
  } catch (err) {
    if (err instanceof DuplicateTimetableTitleError)
      return res.status(403).json({errcode: errcode.DUPLICATE_TIMETABLE_TITLE, message:"duplicate title"});
    if (err instanceof TimetableNotFoundError)
      return res.status(404).json({errcode: errcode.TIMETABLE_NOT_FOUND, message:"timetable not found"});
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"update timetable title failed"});
  }
});

export = router;
