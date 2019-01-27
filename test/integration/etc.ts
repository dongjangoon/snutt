import supertest = require('supertest');

export = function(request: supertest.SuperTest<supertest.Test>) {
  it('Color lists', function(done) {
    request.get('/colors')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        var colors = res.body.colors;
        var names = res.body.names;
        if (!colors[0].fg || !colors[0].bg)
            return done("No colors");
        if (!names[0])
          return done("No color names");
        done(err);
      });
  });
}