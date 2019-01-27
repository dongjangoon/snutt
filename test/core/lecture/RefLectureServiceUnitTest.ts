import sinon = require('sinon');
import assert = require('assert');
import rewire = require('rewire');

import RefLecture from '@app/core/lecture/model/RefLecture';
import RefLectureService = require('@app/core/lecture/RefLectureService');
import RefLectureRepository = require('@app/core/lecture/RefLectureRepository');

let RefLectureServiceRewire = rewire<typeof RefLectureService>('@app/core/lecture/RefLectureService');

describe("RefLectureServiceUnitTest", function() {
  let sinonSandbox = sinon.createSandbox();

  afterEach(function() {
    sinonSandbox.restore();
  });
})
