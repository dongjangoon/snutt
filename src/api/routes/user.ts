/**
 * routes/api/user.js
 * API for User CRUD
 */
import express = require('express');
import request = require('request-promise-native');
var router = express.Router();
import config = require('core/config');
import facebook = require('core/facebook');
import fcm = require('core/fcm');
import {UserModel} from 'core/model/user';
import errcode = require('core/errcode');
import * as log4js from 'log4js';
var logger = log4js.getLogger();

router.get('/info', function (req, res, next) {
  var user:UserModel = req["user"];
  return res.json(user.getUserInfo());
});

router.put('/info', async function (req, res, next) {
  var user:UserModel = req["user"];
  try {
    if (req.body.email) 
      await user.setUserInfo(req.body.email);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, messsage:"server fault"});
  }

  res.json({message:"ok"});
});

router.post('/password', async function (req, res, next) {
  var user:UserModel = req["user"];
  if (user.hasLocal()) return res.status(403).json({errcode: errcode.ALREADY_LOCAL_ACCOUNT, message: "already have local id"});
  try {
    await user.attachLocal(req.body.id, req.body.password);
  } catch (err) {
    if (err == errcode.INVALID_PASSWORD)
      return res.status(403).json({errcode: err, message:"invalid password"});
    else if (err == errcode.INVALID_ID)
      return res.status(403).json({errcode: err, message:"invalid id"});
    else if (err == errcode.DUPLICATE_ID)
      return res.status(403).json({errcode: err, message:"duplicate id"});
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
  }
  res.json({token: user.getCredentialHash()});
});

router.put('/password', async function (req, res, next) {
  var user:UserModel = req["user"];
  if (!user.hasLocal()) return res.status(403).json({errcode: errcode.NOT_LOCAL_ACCOUNT, message: "no local id"});
  try {
    let result = await user.verifyPassword(req.body.old_password);
    if (!result) return res.status(403).json({errcode: errcode.WRONG_PASSWORD, message:"wrong old password"});
    await user.changeLocalPassword(req.body.new_password);
  } catch (err) {
    if (err == errcode.INVALID_PASSWORD)
      return res.status(403).json({errcode: err, message:"invalid password"});
    logger.error(err);
    return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
  }
  res.json({token: user.getCredentialHash()});
});

// Credential has been modified. Should re-send token
router.post('/facebook', async function (req, res, next) {
  let user:UserModel = req["user"];
  if (user.hasFb()) return res.status(403).json({errcode: errcode.ALREADY_FB_ACCOUNT, message: "already attached"});
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({errcode: errcode.NO_FB_ID_OR_TOKEN, message: "both fb_id and fb_token required"});

  let fbInfo;
  try {
    fbInfo = await facebook.getFbInfo(req.body.fb_id, req.body.fb_token);
  } catch (err) {
    return res.status(403).json({errcode: errcode.WRONG_FB_TOKEN, message: "wrong facebook token"});
  }

  try {
    let duplicateUser = await UserModel.getByFb(fbInfo.fbName, fbInfo.fbId);
    if (duplicateUser) return res.status(403).json({errcode: errcode.FB_ID_WITH_SOMEONE_ELSE, message: "already attached with this fb_id"});
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
  }

  try {
    await user.attachFb(fbInfo.fbName, fbInfo.fbId);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
  }
  return res.json({token: user.getCredentialHash()});
});

router.delete('/facebook', async function (req, res, next) {
  var user:UserModel = req["user"];
  if (!user.hasFb()) return res.status(403).json({errcode: errcode.NOT_FB_ACCOUNT, message: "not attached yet"});
  if (!user.hasLocal()) return res.status(403).json({errcode: errcode.NOT_LOCAL_ACCOUNT, message: "no local id"});
  try {
    await user.detachFb();
  } catch (err) {
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
  }

  return res.json({token: user.getCredentialHash()});
});

router.get('/facebook', function (req, res, next) {
  var user:UserModel = req["user"];
  return res.json({attached: user.hasFb(), name: user.getFbName()});
});

router.post('/device/:registration_id', async function (req, res, next) {
  var user:UserModel = req["user"];
  try {
    await user.attachDevice(req.params.registration_id);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:err});
  }
  res.json({message:"ok"});
});

router.delete('/device/:registration_id', async function (req, res, next) {
  var user:UserModel = req["user"];
  try {
    await user.detachDevice(req.params.registration_id);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:err});
  }
  res.json({message:"ok"});
});

router.delete('/account', async function(req, res, next){
  var user:UserModel = req["user"];
  try {
    await user.deactivate();
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, messsage:"server fault"});
  }
  res.json({message:"ok"});
});

export = router;