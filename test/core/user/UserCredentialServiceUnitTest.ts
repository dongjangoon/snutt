import sinon = require('sinon');
import assert = require('assert');
import assertRejects = require('assert-rejects');
import bcrypt = require('bcrypt');
import crypto = require('crypto');
import rewire = require('rewire');

import User from '@app/core/user/model/User';
import UserCredentialService = require('@app/core/user/UserCredentialService');
import FacebookService = require('@app/core/facebook/FacebookService');
import UserService = require('@app/core/user/UserService');
import UserCredential from '@app/core/user/model/UserCredential';
import InvalidLocalPasswordError from '@app/core/user/error/InvalidLocalPasswordError';
import InvalidFbIdOrTokenError from '@app/core/facebook/error/InvalidFbIdOrTokenError';
import NotLocalAccountError from '@app/core/user/error/NotLocalAccountError';
import InvalidLocalIdError from '@app/core/user/error/InvalidLocalIdError';
import DuplicateLocalIdError from '@app/core/user/error/DuplicateLocalIdError';
import AlreadyRegisteredFbIdError from '@app/core/user/error/AlreadyRegisteredFbIdError';

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
    let userServiceModifyStub = sinonSandbox.stub(UserService, 'modify');

    await UserCredentialServiceRewire.__with__({'makeCredentialHmac': makeCredentialHmacStub})(
      async function() {
        UserCredentialServiceRewire.__get__('modifyCredential')(testUser);

        assert(userServiceModifyStub.calledOnce);
        assert.equal(userServiceModifyStub.getCall(0).args[0].credentialHash, testCredentialHash);
      }
    );
  })

  it("validatePassword__success", async function() {
    let testPw = 'abcd1!';
    UserCredentialServiceRewire.__get__('validatePassword')(testPw);
  })
  
  it("validatePassword__fail__noAlphabet", async function() {
    let testPw = '123456';
    assert.throws((() => UserCredentialServiceRewire.__get__('validatePassword')(testPw)),
        InvalidLocalPasswordError);
  })

  it("validatePassword__fail__noDigit", async function() {
    let testPw = 'abcdef';
    assert.throws((() => UserCredentialServiceRewire.__get__('validatePassword')(testPw)),
        InvalidLocalPasswordError);
  })

  it("validatePassword__fail__tooShort", async function() {
    let testPw = 'a2345';
    assert.throws((() => UserCredentialServiceRewire.__get__('validatePassword')(testPw)),
        InvalidLocalPasswordError);
  })

  it("validatePassword__fail__tooLong", async function() {
    let testPw = 'a23456789012345678901';
    assert.throws((() => UserCredentialServiceRewire.__get__('validatePassword')(testPw)),
        InvalidLocalPasswordError);
  })

  it("makePasswordHash__success", async function() {
    let testPassword = 'pw';
    let encrypted = 'pwenc';
    let bcryptHashStub = sinonSandbox.stub(bcrypt, 'hash');

    bcryptHashStub.withArgs(testPassword, 4).resolves(encrypted);

    let expected = encrypted;
    let actual = await UserCredentialServiceRewire.__get__('makePasswordHash')(testPassword);

    assert.equal(actual, expected);
  })

  it("changeLocalPassword__success", async function() {
    let testPw = 'pw';
    let testPwHash = 'pwh';
    let user: User = {
      credential: {},
      credentialHash: null
    };

    let validatePasswordStub = sinonSandbox.stub();
    let makePasswordHashStub = sinonSandbox.stub();
    let modifyCredentialStub = sinonSandbox.stub();
    makePasswordHashStub.withArgs(testPw).resolves(testPwHash);
    await UserCredentialServiceRewire.__with__({
      validatePassword: validatePasswordStub,
      makePasswordHash: makePasswordHashStub,
      modifyCredential: modifyCredentialStub
    })(
      async function () {
        await UserCredentialServiceRewire.changeLocalPassword(user, testPw);
        assert(validatePasswordStub.withArgs(testPw).calledOnce);
        assert(modifyCredentialStub.calledOnce);
        assert.equal(modifyCredentialStub.firstCall.args[0].credential.localPw, testPwHash);
      }
    )
  })

  it("hasFb__true", async function() {
    let user: User = {
      credential: {
        fbId: '1234'
      },
      credentialHash: null
    };
    assert(UserCredentialService.hasFb(user));
  })

  it("hasFb__false", async function() {
    let user: User = {
      credential: {
      },
      credentialHash: null
    };
    assert.equal(UserCredentialService.hasFb(user), false);
  })

  it("hasLocal__true", async function() {
    let user: User = {
      credential: {
        localId: '1234'
      },
      credentialHash: null
    };
    assert(UserCredentialService.hasLocal(user));
  })

  it("hasLocal__false", async function() {
    let user: User = {
      credential: {
      },
      credentialHash: null
    };
    assert.equal(UserCredentialService.hasLocal(user), false);
  })

  it("attachFb__success", async function() {
    let fbId = 'asdf';
    let fbName = 'name';
    let fbToken = 'fdas';
    let user: User = {
      credential: {},
      credentialHash: null
    };

    let makeFbCredentialStub = sinonSandbox.stub();
    makeFbCredentialStub.resolves({fbId: fbId, fbName: fbName});
    let modifyCredentialStub = sinonSandbox.stub();
    UserCredentialServiceRewire.__with__({
      makeFbCredential: makeFbCredentialStub,
      modifyCredential: modifyCredentialStub
    })(async function() {
      await UserCredentialServiceRewire.attachFb(user, fbId, fbToken);
      assert(modifyCredentialStub.calledOnce);
      assert.equal(modifyCredentialStub.firstCall.args[0].credential.fbName, fbName);
      assert.equal(modifyCredentialStub.firstCall.args[0].credential.fbId, fbId);
    })
  })

  it("attachFb__fail__noFbId", async function() {
    let fbId = null;
    let fbToken = 'fdas';
    let user: User = {
      credential: {},
      credentialHash: null
    };

    assertRejects(UserCredentialService.attachFb(user, fbId, fbToken), InvalidFbIdOrTokenError);
  })

  it("detachFb__success", async function() {
    let user: User = {
      credential: {
        fbId: 'asdf',
        fbName: 'bcccx'
      },
      credentialHash: null
    };

    let hasLocalStub = sinonSandbox.stub();
    hasLocalStub.returns(true);
    let modifyCredentialStub = sinonSandbox.stub();
    UserCredentialServiceRewire.__with__({
      hasLocal: hasLocalStub,
      modifyCredential: modifyCredentialStub
    })(async function() {
      await UserCredentialServiceRewire.detachFb(user);
      assert(modifyCredentialStub.calledOnce);
      assert.equal(modifyCredentialStub.firstCall.args[0].credential.fbName, null);
      assert.equal(modifyCredentialStub.firstCall.args[0].credential.fbId, null);
    })
  })

  it("detachFb__fail__noLocal", async function() {
    let user: User = {
      credential: {
        fbId: 'asdf',
        fbName: 'bcccx'
      },
      credentialHash: null
    };

    let hasLocalStub = sinonSandbox.stub();
    hasLocalStub.returns(false);
    let modifyCredentialStub = sinonSandbox.stub();
    UserCredentialServiceRewire.__with__({
      hasLocal: hasLocalStub,
      modifyCredential: modifyCredentialStub
    })(async function() {
      assertRejects(UserCredentialServiceRewire.detachFb(user), NotLocalAccountError);
    })
  })

  it("validateLocalId__success", async function() {
    let id = 'snutt';
    UserCredentialServiceRewire.__get__('validateLocalId')(id);
  });

  it("validateLocalId__fail__nullId", async function() {
    let id = null;
    assert.throws(() => UserCredentialServiceRewire.__get__('validateLocalId')(id), InvalidLocalIdError);
  });

  it("validateLocalId__fail__tooShort", async function() {
    let id = 'abc';
    assert.throws(() => UserCredentialServiceRewire.__get__('validateLocalId')(id), InvalidLocalIdError);
  });

  it("validateLocalId__fail__tooLong", async function() {
    let id = 'abcd56789012345678901234567890123';
    assert.throws(() => UserCredentialServiceRewire.__get__('validateLocalId')(id), InvalidLocalIdError);
  });

  it("validateLocalId__fail__specialChar", async function() {
    let id = 'abcd!';
    assert.throws(() => UserCredentialServiceRewire.__get__('validateLocalId')(id), InvalidLocalIdError);
  });

  it("attachLocal__success", async function() {
    let user: User = {
      credential: {},
      credentialHash: null
    };
    let id = 'id';
    let password = 'pw';
    let passwordHash = 'pwenc';

    let makeLocalCredentialStub = sinonSandbox.stub();
    makeLocalCredentialStub.resolves({
      localId: id,
      localPw: passwordHash
    });
    let modifyCredentialStub = sinonSandbox.stub();
    UserCredentialServiceRewire.__with__(
      {
        makeLocalCredential: makeLocalCredentialStub,
        modifyCredential: modifyCredentialStub
      }
    )(
      async function() {
        await UserCredentialServiceRewire.attachLocal(user, id, password);
        assert(modifyCredentialStub.calledOnce);
        assert.equal(modifyCredentialStub.firstCall.args[0].credential.localId, id);
        assert.equal(modifyCredentialStub.firstCall.args[0].credential.localPw, passwordHash);
      }
    )
  })

  it("attachTemp__success", async function() {
    let user: User = {
      credential: {},
      credentialHash: null
    };
    let tempDate = new Date();
    let tempSeed = 5;

    let makeTempCredentialStub = sinonSandbox.stub();
    makeTempCredentialStub.resolves({
      tempDate: tempDate,
      tempSeed: tempSeed
    });
    let modifyCredentialStub = sinonSandbox.stub();
    UserCredentialServiceRewire.__with__(
      {
        makeTempCredential: makeTempCredentialStub,
        modifyCredential: modifyCredentialStub
      }
    )(
      async function() {
        await UserCredentialServiceRewire.attachTemp(user);
        assert(modifyCredentialStub.calledOnce);
        assert.equal(modifyCredentialStub.firstCall.args[0].credential.tempDate, tempDate);
        assert.equal(modifyCredentialStub.firstCall.args[0].credential.tempSeed, tempSeed);
      }
    )
  })

  it("makeLocalCredential__success", async function() {
    let id = 'id';
    let password = 'pw';
    let passwordHash = 'pwenc';

    let validateLocalIdStub = sinonSandbox.stub();
    let validatePasswordStub = sinonSandbox.stub();
    let userServiceGetByLocalIdStub = sinonSandbox.stub(UserService, 'getByLocalId');
    userServiceGetByLocalIdStub.resolves(null);
    let makePasswordHashStub = sinonSandbox.stub();
    makePasswordHashStub.resolves(passwordHash);

    UserCredentialServiceRewire.__with__(
      {
        validateLocalId: validateLocalIdStub,
        validatePassword: validatePasswordStub,
        makePasswordHash: makePasswordHashStub
      }
    )(
      async function() {
        let result = await UserCredentialServiceRewire.makeLocalCredential(id, password);
        assert(validateLocalIdStub.withArgs(id).calledOnce);
        assert(validatePasswordStub.withArgs(password).calledOnce);
        assert(userServiceGetByLocalIdStub.withArgs(id).calledOnce);
        assert.equal(result.localId, id);
        assert.equal(result.localPw, passwordHash);
      }
    )
  })

  it("makeLocalCredential__fail__duplicateId", async function() {
    let id = 'id';
    let password = 'pw';
    let passwordHash = 'pwenc';

    let validateLocalIdStub = sinonSandbox.stub();
    let validatePasswordStub = sinonSandbox.stub();
    let userServiceGetByLocalIdStub = sinonSandbox.stub(UserService, 'getByLocalId');
    userServiceGetByLocalIdStub.resolves({});
    let makePasswordHashStub = sinonSandbox.stub();
    makePasswordHashStub.resolves(passwordHash);

    UserCredentialServiceRewire.__with__(
      {
        validateLocalId: validateLocalIdStub,
        validatePassword: validatePasswordStub,
        makePasswordHash: makePasswordHashStub
      }
    )(
      async function() {
        assertRejects(UserCredentialServiceRewire.makeLocalCredential(id, password),
        DuplicateLocalIdError);
      }
    )
  })

  it("makeFbCredential__success", async function() {
    let fbId = 'adsf';
    let fbToken = 'fda';
    let fbName = 'name';

    let getFbInfoStub = sinonSandbox.stub(FacebookService, 'getFbInfo');
    getFbInfoStub.withArgs(fbId, fbToken).resolves({
      fbId: fbId,
      fbName: fbName
    });
    let getByFbStub = sinonSandbox.stub(UserService, 'getByFb');
    getByFbStub.withArgs(fbId).resolves(null);

    let result = await UserCredentialService.makeFbCredential(fbId, fbToken);
    assert.equal(result.fbId, fbId);
    assert.equal(result.fbName, fbName);
  })

  it("makeFbCredential__fail__alreadyRegisteredFbId", async function() {
    let fbId = 'adsf';
    let fbToken = 'fda';
    let fbName = 'name';

    let getFbInfoStub = sinonSandbox.stub(FacebookService, 'getFbInfo');
    getFbInfoStub.withArgs(fbId, fbToken).resolves({
      fbId: fbId,
      fbName: fbName
    });
    let getByFbStub = sinonSandbox.stub(UserService, 'getByFb');
    getByFbStub.withArgs(fbId).resolves({});

    assertRejects(UserCredentialService.makeFbCredential(fbId, fbToken), AlreadyRegisteredFbIdError);
  })

  it("makeTempCredential__success", async function() {
    let result = await UserCredentialService.makeTempCredential();
    assert(result != null);
  })
})
