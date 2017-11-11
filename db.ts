import mongoose = require('mongoose');
import config = require('./config/config');
import * as log4js from 'log4js';
var logger = log4js.getLogger();
mongoose.Promise = global.Promise;

// connect mongoose
async function connect(): Promise<void> {
  let promise = new Promise(function(resolve, reject){
    mongoose.connect(config.mongoUri, function(err) {
      if(err) {
        reject(err.message);
      }
      if (process.env.NODE_ENV == 'mocha')
        return resolve();

      /**
       * DB 버전이 2.4 이상인지 확인
       * 서치 쿼리에서 사용하는 로직이 2.4 이사이어야만 함
       */
      var admin = mongoose.connection.db.admin();
      admin.buildInfo(function (err, info) {
        if (err) {
          return reject("Could not get mongodb version");
        }
        logger.info("MongoDB "+info.version+" connected");
        if (parseFloat(info.version) < 2.4) {
          logger.warn("MongoDB version is outdated. (< 2.4) Service might not work properly");
        }
        resolve();
      });
    });
  });

  try {
    await promise;
  } catch (err) {
    logger.error(err);
  }
}

connect();

export = mongoose;
