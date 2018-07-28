import mongoose = require('mongoose');
import ObjectUtil = require('@app/core/common/util/ObjectUtil');

export async function insert(obj: any) {
    let cloned = ObjectUtil.deepCopy(obj);
    cloned.timestamp = Date.now();
    await mongoose.connection.collection("query_logs").insert(cloned);
}

export async function deleteBeforeTimestamp(timestamp: number) {
    let query = { timestamp: { $lt: timestamp }};
    await mongoose.connection.collection("query_logs").deleteMany(query);
}
