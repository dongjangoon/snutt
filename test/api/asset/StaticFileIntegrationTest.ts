process.env.NODE_ENV = 'mocha';
import assert = require('assert');
import log4js = require('log4js');
import supertest = require('supertest');
import app = require('@app/api/app');

let logger = log4js.getLogger();
let request = supertest(app);

describe("StaticFileIntegrationTest", function() {
    it("waffle_logo__success", function(done) {
        request.get('/asset/waffle_logo.png')
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });
})
