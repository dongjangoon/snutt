import bcrypt = require('bcrypt');
import crypto = require('crypto');
import log4js = require('log4js');

import property = require('@app/core/config/property');
import User from '@app/core/user/model/User';
import UserCredential from '@app/core/user/model/UserCredential';
import UserService = require('@app/core/user/UserService');
import errcode = require('@app/core/errcode');
import facebook = require('@app/core/facebook');

let logger = log4js.getLogger();

export function isRightPassword(user: User, password: string): Promise<boolean> {
    let originalHash = user.credential.localPw;
    if (!password || !originalHash) return Promise.resolve(false);
    return new Promise(function (resolve, reject) {
        bcrypt.compare(password, originalHash, function (err, same) {
            if (err) return reject(err);
            resolve(same);
        });
    });
}

export async function isRightFbToken(user: User, fbToken: string): Promise<boolean> {
    try {
        let fbInfo = await facebook.getFbInfo(user.credential.fbId, fbToken);
        return fbInfo.fbId === user.credential.fbId;
    } catch (err) {
        return false;
    }
}

export function compareCredentialHash(user: User, hash: string): boolean {
    return user.credentialHash === hash;
}

export function makeCredentialHmac(userCredential: UserCredential): string {
    var hmac = crypto.createHmac('sha256', property.secretKey);
    hmac.update(JSON.stringify(userCredential));
    return hmac.digest('hex');
}

async function modifyCredential(user: User): Promise<void> {
    user.credentialHash = makeCredentialHmac(user.credential);
    UserService.modify(user);
}


function validatePassword(password: string): void {
    if (!password || !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i)) {
        throw errcode.INVALID_PASSWORD;
    }
}

function makePasswordHash(password: string): Promise<string> {
    return new Promise(function (resolve, reject) {
        bcrypt.hash(password, 4, function (err, encrypted) {
            if (err) return reject(err);
            resolve(encrypted);
        });
    });
}

export async function changeLocalPassword(user: User, password: string): Promise<void> {
    validatePassword(password);
    let passwordHash = await makePasswordHash(password);
    user.credential.localPw = passwordHash;
    return modifyCredential(user);
}

export function hasFb(user: User): boolean {
    return !(user.credential.fbId === null || user.credential.fbId === undefined);
}

export function hasLocal(user: User): boolean {
    return user.credential.localId !== null;
}

export async function attachFb(user: User, fbId: string, fbToken: string): Promise<void> {
    if (!fbId) {
        var err = errcode.NO_FB_ID_OR_TOKEN;
        return Promise.reject(err);
    }

    let fbCredential = await makeFbCredential(fbId, fbToken);
    user.credential.fbName = fbCredential.fbName;
    user.credential.fbId = fbCredential.fbId;
    await modifyCredential(user);
}

export async function detachFb(user: User): Promise<void> {
    if (!hasLocal(user)) {
        var err = errcode.NOT_LOCAL_ACCOUNT;
        return Promise.reject(err);
    }
    user.credential.fbName = null;
    user.credential.fbId = null;
    await modifyCredential(user);
}

function validateLocalId(id: string): void {
    if (!id || !id.match(/^[a-z0-9]{4,32}$/i)) {
        throw errcode.INVALID_ID;
    }
}

export async function attachLocal(user: User, id: string, password: string): Promise<void> {
    let localCredential = await makeLocalCredential(id, password);

    user.credential.localId = localCredential.localId;
    user.credential.localPw = localCredential.localPw;
    await modifyCredential(user);
}

export async function attachTemp(user: User): Promise<void> {
    let tempCredential = await makeTempCredential();
    user.credential.tempDate = tempCredential.tempDate;
    user.credential.tempSeed = tempCredential.tempSeed;
    await modifyCredential(user);
}

export async function makeLocalCredential(id: string, password: string): Promise<UserCredential> {
    validateLocalId(id);
    validatePassword(password);

    if (await UserService.getByLocalId(id)) {
        throw errcode.DUPLICATE_ID;
    }

    let passwordHash = await makePasswordHash(password);

    return {
        localId: id,
        localPw: passwordHash
    }
}

export async function makeFbCredential(fbId: string, fbToken: string): Promise<UserCredential> {
    if (await UserService.getByFb(fbId)) {
        throw errcode.FB_ID_WITH_SOMEONE_ELSE;
    }

    try {
        let fbInfo = await facebook.getFbInfo(fbId, fbToken);

        return {
            fbId: fbInfo.fbId,
            fbName: fbInfo.fbName
        }
    } catch (err) {
        logger.error("makeFbCredential failed. fbId:", fbId, "fbToken:", fbToken);
        throw err;
    }
}

export async function makeTempCredential(): Promise<UserCredential> {
    return {
        tempDate: new Date(),
        tempSeed: Math.floor(Math.random() * 1000)
    }
}
