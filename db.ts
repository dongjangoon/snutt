import mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// connect mongoose
mongoose.connect('mongodb://localhost/snutt', function(err) {
  if(err) {
    console.log(err);
    throw err;
  }
  if (process.env.NODE_ENV == 'mocha')
    return;

  /**
   * DB 버전이 2.4 이상인지 확인
   * 서치 쿼리에서 사용하는 로직이 2.4 이사이어야만 함
   */
  var admin = mongoose.connection.db.admin();
  admin.buildInfo(function (err, info) {
    if (err) {
      return console.log("Could not get mongodb version");
    }
    console.log("MongoDB "+info.version+" connected");
    if (parseFloat(info.version) < 2.4) {
      console.log("MongoDB version is outdated. (< 2.4) Service might not work properly");
    }
  });
  //console.log('mongodb connected');
});

export = mongoose;
