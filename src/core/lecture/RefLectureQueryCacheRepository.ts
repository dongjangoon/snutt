import RedisKeyUtil = require('@app/core/redis/RedisKeyUtil');
import RedisUtil = require('@app/core/redis/RedisUtil');
import log4js = require('log4js');
import RefLecture from './model/RefLecture';
let logger = log4js.getLogger();

export async function getListOfLectureListCacheFromPageList(query: any, pageList: number[]): Promise<RefLecture[][] | null> {
    let keyList = pageList.map(page => RedisKeyUtil.getLectureQueryKey(query, page))
    let lectureListStringList = await RedisUtil.mget(keyList);
    let lectureListList: RefLecture[][] = lectureListStringList.map(parseLectureListString);
    return lectureListList;
}

function parseLectureListString(str: string): RefLecture[] | null {
    let lectureList: RefLecture[] = JSON.parse(str);
    if (!lectureList || typeof lectureList.length !== 'number') {
        return null;
    } else {
        return lectureList;
    }
}

export async function setLectureListCache(query: any, page: number, lectureList: RefLecture[]): Promise<void> {
    let key = RedisKeyUtil.getLectureQueryKey(query, page);
    let lectureListString = JSON.stringify(lectureList);
    await RedisUtil.set(key, lectureListString);
}
