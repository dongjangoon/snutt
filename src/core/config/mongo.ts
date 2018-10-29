import mongoose = require('mongoose');
import property = require('@app/core/config/property');
import log4js = require('log4js');

var logger = log4js.getLogger();

// nodejs Promise를 사용
mongoose.Promise = global.Promise;

mongoose.connect(property.get('mongo.uri'), function(err) {
  if(err) {
    logger.error(err);
    return;
  }

  /**
   * DB 버전이 2.4 이상인지 확인
   * 서치 쿼리에서 사용하는 로직이 2.4 이사이어야만 함
   */
  var admin = mongoose.connection.db.admin();
  admin.buildInfo(function (err, info) {
    if (err) {
      logger.error(err);
      logger.error("Could not get mongodb version");
      return;
    }

    logger.info("MongoDB "+info.version+" connected");
    if (parseFloat(info.version) < 2.4) {
      logger.warn("MongoDB version is outdated. (< 2.4) Service might not work properly");
    }
  });
});
