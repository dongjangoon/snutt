process.env.NODE_ENV = 'mocha';
import assert = require('assert');

require('@test/config/log');
import request = require('@test/config/supertest');

describe("StaticPageRouterIntegrationTest", function() {
    it("terms_of_service__success", function(done) {
        request.get('/terms_of_service')
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it("privacy_policy__success", function(done) {
        request.get('/privacy_policy')
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it("member__success", function(done) {
        request.get('/member')
            .expect(200)
            .end(function(err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    })
})
