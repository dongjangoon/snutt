import mongoose = require('mongoose');

export async function getStatistics() {
    let yesterdayTime = Date.now() - 24 * 3600;
    let userCountPromise = mongoose.connection.db.collection('users').count().exec();
    let tableCountPromise = mongoose.connection.db.collection('timetables').count().exec();
    let recentQueryCountPromise = mongoose.connection.db.collection('query_logs')
            .count({timestamp: { $gt: yesterdayTime}}).exec();
    return {
        userCount: await userCountPromise,
        tableCount: await tableCountPromise,
        recentQueryCount: await recentQueryCountPromise
    }
}