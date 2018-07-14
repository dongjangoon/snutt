import sinon = require('sinon');
import assert = require('assert');
import bcrypt = require('bcrypt');
import crypto = require('crypto');
import rewire = require('rewire');

import User from '@app/core/user/model/User';
import UserCredentialService = require('@app/core/user/UserCredentialService');
import FacebookService = require('@app/core/FacebookService');
import UserService = require('@app/core/user/UserService');
import UserCredential from 'core/user/model/UserCredential';

let UserCredentialServiceRewire = rewire<typeof UserCredentialService>('@app/core/user/UserCredentialService');

describe("UserCredentialServiceUnitTest", function() {
  let sinonSandbox = sinon.createSandbox();

  afterEach(function() {
    sinonSandbox.restore();
  });

  it("isRightPassword__true", async function() {
    let password = 'pw';
    let passwordHash = 'pwhash';
    let user: User = {
      credential: {
        localPw: passwordHash
      },
      credentialHash: null
    };

    let bcryptCompareStub = sinonSandbox.stub(bcrypt, "compare");
    bcryptCompareStub.withArgs(password, passwordHash).resolves(true);

    let expected = true;
    let actual = await UserCredentialService.isRightPassword(user, password);

    assert.equal(actual, expected);
  });

  it("isRightPassword__false__nullPw", async function() {
    let password = null;
    let passwordHash = 'pwhash';
    let user: User = {
      credential: {
        localPw: passwordHash
      },
      credentialHash: null
    };

    let bcryptCompareStub = sinonSandbox.stub(bcrypt, "compare");
    bcryptCompareStub.withArgs(password, passwordHash).resolves(true);

    let expected = false;
    let actual = await UserCredentialService.isRightPassword(user, password);

    assert.equal(actual, expected);
  });

  it("isRightPassword__false__noPwHash", async function() {
    let password = 'pw';
    let passwordHash = null;
    let user: User = {
      credential: {
        localPw: passwordHash
      },
      credentialHash: null
    };

    let bcryptCompareStub = sinonSandbox.stub(bcrypt, "compare");
    bcryptCompareStub.withArgs(password, passwordHash).resolves(true);

    let expected = false;
    let actual = await UserCredentialService.isRightPassword(user, password);

    assert.equal(actual, expected);
  });

  it("isRightFbToken__true", async function() {
    let fbId = '1234';
    let fbToken = '12345';
    let fbName = 'John';
    let user: User = {
      credential: {
        fbId: fbId
      },
      credentialHash: null
    }

    let facebookGetFbInfoStub = sinonSandbox.stub(FacebookService, 'getFbInfo');
    facebookGetFbInfoStub.withArgs(fbId, fbToken).resolves({fbName: fbName, fbId: fbId});

    let expected = true;
    let actual = await UserCredentialService.isRightFbToken(user, fbToken);
    assert.equal(actual, expected);
  });

  it("isRightFbToken__false__notSameFbId", async function() {
    let fbId = '1234';
    let fbToken = '12345';
    let fbName = 'John';
    let user: User = {
      credential: {
        fbId: fbId
      },
      credentialHash: null
    }

    let facebookGetFbInfoStub = sinonSandbox.stub(FacebookService, 'getFbInfo');
    facebookGetFbInfoStub.withArgs(fbId, fbToken).resolves({fbName: fbName, fbId: '4321'});

    let expected = false;
    let actual = await UserCredentialService.isRightFbToken(user, fbToken);
    assert.equal(actual, expected);
  });

  it("isRightFbToken__false__facebookError", async function() {
    let fbId = '1234';
    let fbToken = '12345';
    let fbName = 'John';
    let user: User = {
      credential: {
        fbId: fbId
      },
      credentialHash: null
    }

    let facebookGetFbInfoStub = sinonSandbox.stub(FacebookService, 'getFbInfo');
    facebookGetFbInfoStub.withArgs(fbId, fbToken).rejects("testError");

    let expected = false;
    let actual = await UserCredentialService.isRightFbToken(user, fbToken);
    assert.equal(actual, expected);
  });

  it("compareCredentialHash__true", async function() {
    let testCredentialHash = 'ch';
    let user: User = {
      credential: null,
      credentialHash: testCredentialHash
    };

    let expected = true;
    let actual = UserCredentialService.compareCredentialHash(user, testCredentialHash);
    assert.equal(actual, expected);
  });

  it("compareCredentialHash__false", async function() {
    let testCredentialHash = 'ch';
    let user: User = {
      credential: null,
      credentialHash: testCredentialHash
    };

    let expected = false;
    let actual = UserCredentialService.compareCredentialHash(user, 'ch2');
    assert.equal(actual, expected);
  });

  it("makeCredentialHmac__success", async function() {
    let testCredential: UserCredential = {}
    let testCredentialJsonStr = JSON.stringify(testCredential);
    let testHmacResult = 'result';
    
    let cryptoCreateHmacStub = sinonSandbox.stub(crypto, "createHmac");
    let hmacUpdateStub = sinonSandbox.stub();
    let hmacDigestStub = sinonSandbox.stub();

    cryptoCreateHmacStub.withArgs('sha256', sinon.match.any).returns({
      update: hmacUpdateStub,
      digest: hmacDigestStub
    });

    hmacDigestStub.withArgs('hex').returns(testHmacResult);

    let expected = testHmacResult;
    let actual = UserCredentialService.makeCredentialHmac(testCredential);

    assert(hmacUpdateStub.withArgs(testCredentialJsonStr).calledOnce);
    assert.equal(actual, expected);
  });

  it("modifyCredential__success", async function() {
    let testCredential: UserCredential = {};
    let testCredentialHash = 'hash';
    let testUser: User = {
      credential: testCredential,
      credentialHash: null
    };

    let makeCredentialHmacStub = sinonSandbox.stub();
    makeCredentialHmacStub.withArgs(testCredential).returns(testCredentialHash);
    UserCredentialServiceRewire.__set__('makeCredentialHmac', makeCredentialHmacStub);
    let userServiceModifyStub = sinonSandbox.stub(UserService, 'modify');

    UserCredentialServiceRewire.__get__('modifyCredential')(testUser);

    assert.equal(userServiceModifyStub.getCall(0).args[0].credentialHash, testCredentialHash);
  })
})

/*

async function modifyCredential(user: User): Promise<void> {
  user.credentialHash = makeCredentialHmac(user.credential);
  await UserService.modify(user);
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
      logger.error(err);
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
*/
