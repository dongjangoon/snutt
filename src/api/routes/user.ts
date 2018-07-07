/**
 * routes/api/user.js
 * API for User CRUD
 */
import express = require('express');
import facebook = require('@app/core/facebook');
import User from '@app/core/user/model/User';
import UserCredentialService = require('@app/core/user/UserCredentialService');
import UserService = require('@app/core/user/UserService');
import UserDeviceService = require('@app/core/user/UserDeviceService');
import errcode = require('@app/core/errcode');
import * as log4js from 'log4js';
var logger = log4js.getLogger();
var router = express.Router();

router.get('/info', function (req, res, next) {
  var user:User = req["user"];
  return res.json(UserService.getUserInfo(user));
});

router.put('/info', async function (req, res, next) {
  var user:User = req["user"];
  try {
    if (req.body.email) 
      await UserService.setUserInfo(user, req.body.email);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, messsage:"server fault"});
  }

  res.json({message:"ok"});
});

router.post('/password', async function (req, res, next) {
  var user:User = req["user"];
  if (UserCredentialService.hasLocal(user)) return res.status(403).json({errcode: errcode.ALREADY_LOCAL_ACCOUNT, message: "already have local id"});
  try {
    await UserCredentialService.attachLocal(user, req.body.id, req.body.password);
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
  res.json({token: user.credentialHash});
});

router.put('/password', async function (req, res, next) {
  var user:User = req["user"];
  if (!UserCredentialService.hasLocal(user)) return res.status(403).json({errcode: errcode.NOT_LOCAL_ACCOUNT, message: "no local id"});
  try {
    let result = await UserCredentialService.isRightPassword(user, req.body.old_password);
    if (!result) return res.status(403).json({errcode: errcode.WRONG_PASSWORD, message:"wrong old password"});
    await UserCredentialService.changeLocalPassword(user, req.body.new_password);
  } catch (err) {
    if (err == errcode.INVALID_PASSWORD)
      return res.status(403).json({errcode: err, message:"invalid password"});
    logger.error(err);
    return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
  }
  res.json({token: user.credentialHash});
});

// Credential has been modified. Should re-send token
router.post('/facebook', async function (req, res, next) {
  let user:User = req["user"];
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({errcode: errcode.NO_FB_ID_OR_TOKEN, message: "both fb_id and fb_token required"});

  let fbToken = req.body.fb_token;
  let fbId = req.body.fb_id;

  try {
    if (UserCredentialService.hasFb(user)) {
      return res.status(403).json({errcode: errcode.ALREADY_FB_ACCOUNT, message: "already attached"});
    }
    await UserCredentialService.attachFb(user, fbId, fbToken);
    return res.json({token: user.credentialHash});
  } catch (err) {
    if (err === errcode.FB_ID_WITH_SOMEONE_ELSE) {
      return res.status(403).json({errcode: errcode.FB_ID_WITH_SOMEONE_ELSE, message: "already attached with this fb_id"});
    } else {
      logger.error(err);
      return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
    }
  }
});

router.delete('/facebook', async function (req, res, next) {
  var user:User = req["user"];
  if (!UserCredentialService.hasFb(user)) return res.status(403).json({errcode: errcode.NOT_FB_ACCOUNT, message: "not attached yet"});
  if (!UserCredentialService.hasLocal(user)) return res.status(403).json({errcode: errcode.NOT_LOCAL_ACCOUNT, message: "no local id"});
  try {
    await UserCredentialService.detachFb(user);
  } catch (err) {
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
  }

  return res.json({token: user.credentialHash});
});

router.get('/facebook', function (req, res, next) {
  var user:User = req["user"];
  return res.json({attached: UserCredentialService.hasFb(user), name: user.credential.fbName});
});

router.post('/device/:registration_id', async function (req, res, next) {
  var user:User = req["user"];
  try {
    await UserDeviceService.attachDevice(user, req.params.registration_id);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:err});
  }
  res.json({message:"ok"});
});

router.delete('/device/:registration_id', async function (req, res, next) {
  var user:User = req["user"];
  try {
    await UserDeviceService.detachDevice(user, req.params.registration_id);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:err});
  }
  res.json({message:"ok"});
});

router.delete('/account', async function(req, res, next){
  var user:User = req["user"];
  try {
    await UserService.deactivate(user);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, messsage:"server fault"});
  }
  res.json({message:"ok"});
});

export = router;
