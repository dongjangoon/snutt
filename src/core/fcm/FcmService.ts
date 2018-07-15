/**
 * Google FIrebase를 이용한 Notification을 돕는 모듈
 * Firebase 설정 값은 {@link config}에서 불러 옴
 * 
 * @author ryeolj5911@gmail.com
 */

import request = require('request-promise-native');
import property = require('@app/core/config/property');
import * as log4js from 'log4js';
var logger = log4js.getLogger();

const device_api_header = {
  "Content-Type":"application/json",
  "Authorization":"key="+property.fcm_api_key,
  "project_id":property.fcm_project_id
};

export function createNotiKey(key_name:string, registration_ids:[string]): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: device_api_header,
      body: {
            "operation": "create",
            "notification_key_name": key_name,
            "registration_ids": registration_ids
      },
      json: true
    }).then(function(body){
      return Promise.resolve(body.notification_key);
    }).catch(function(err){
      logger.error("fcm_create_noti_key: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}

export function getNotiKey(key_name:string): Promise<string> {
  return request({
      method: 'GET',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: device_api_header,
      qs: {
        "notification_key_name": key_name
      },
      json: true
    }).then(function (body) {
      return Promise.resolve(body.notification_key);
    }).catch(function (err) {
      logger.error("fcm_get_noti_key: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}

export function addDevice(key_name:string, key:string, registration_ids:[string]): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: device_api_header,
      body: {
            "operation": "add",
            "notification_key_name": key_name,
            "notification_key": key,
            "registration_ids": registration_ids
      },
      json: true
    }).then(function(body){
      return Promise.resolve(body.notification_key);
    }).catch(function(err){
      logger.error("fcm_add_device: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}

export function removeDevice(key_name:string, key:string, registration_ids:[string]): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: device_api_header,
      body: {
            "operation": "remove",
            "notification_key_name": key_name,
            "notification_key": key,
            "registration_ids": registration_ids
      },
      json: true
    }).then(function(body){
      return Promise.resolve(body.notification_key);
    }).catch(function(err){
      logger.error("fcm_remove_device: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}

export function addTopic(registration_id:string): Promise<any> {
  return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1/'+registration_id+'/rel/topics/global',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+property.fcm_api_key
        // no need for project_id
      }
    }).catch(function(err){
      logger.error("fcm_add_topic: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}

export function removeTopicBatch(registration_tokens:[string]): Promise<any> {
  return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+property.fcm_api_key
        // no need for project_id
      },
      body: {
        "to": "/topics/global",
        "registration_tokens": registration_tokens
      },
      json: true
    }).catch(function(err){
      logger.error("fcm_remove_topic_batch: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}

export function sendMsg(to:string, title:string, body:string): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+property.fcm_api_key
      },
      body: {
            "to": to,
            "notification" : {
              "body" : body,
              "title" : title,
              "sound": "default"
            },
            "priority" : "high",
            "content_available" : true
      },
      json:true,
    }).catch(function(err){
      logger.error("fcm_send_msg: " + err.response.statusMessage);
      return Promise.reject(err.response.statusMessage);
    });
}
