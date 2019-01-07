import crypto = require('crypto');

export function getLectureQueryKey(query: any, page: number) {
    let queryHash = makeMd5HashFromObject(query);
    return "lq-" + queryHash + "-" + page;
}

function makeMd5HashFromObject(object: any) {
    return crypto.createHash('md5').update(JSON.stringify(object)).digest('hex');
}
