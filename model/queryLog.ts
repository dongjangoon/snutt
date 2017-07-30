/**
 * 쿼리 로그를 DB에 저장하는 용도
 * 현재 사용하지 않음
 */

import mongoose = require('mongoose');

var QueryLogSchema = new mongoose.Schema ({
  time: { type: Date, default: Date.now },
  year: { type: Number, min: 2000, max: 2999 },
  semester: { type: String },
  type: { type: String },
  body: String
});

module.exports = mongoose.model('QueryLog', QueryLogSchema);
