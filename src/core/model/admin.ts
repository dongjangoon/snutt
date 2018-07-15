import mongoose = require('mongoose');

export async function getStatistics() {
    let yesterdayTime = Date.now() - 24 * 3600000;
    let userCountPromise = mongoose.connection.db.collection('users').count({});
    let tempUserCountPromise = mongoose.connection.db.collection('users')
            .count({
                $and: [{"credential.localId": null}, {"credential.fbId": null}]
            });
    let tableCountPromise = mongoose.connection.db.collection('timetables').count({});
    let recentQueryCountPromise = mongoose.connection.db.collection('query_logs')
            .count({timestamp: { $gt: yesterdayTime}});
    return {
        userCount: await userCountPromise,
        tempUserCount: await tempUserCountPromise,
        tableCount: await tableCountPromise,
        recentQueryCount: await recentQueryCountPromise
    }
}
