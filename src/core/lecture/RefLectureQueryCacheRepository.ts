import RedisKeyUtil = require('@app/core/redis/RedisKeyUtil');
import RedisUtil = require('@app/core/redis/RedisUtil');
import log4js = require('log4js');
import RefLecture from './model/RefLecture';
let logger = log4js.getLogger();

export async function getListOfLectureListCacheFromPageList(year:number, semester:number, queryString: string, pageList: number[]): Promise<RefLecture[][] | null> {
    let keyList = pageList.map(page => RedisKeyUtil.getLectureQueryKey(year, semester, queryString, page))
    let lectureListStringList = await RedisUtil.mget(keyList);
    let lectureListList: RefLecture[][] = lectureListStringList.map(parseLectureListString);
    return lectureListList;
}

function parseLectureListString(str: string): RefLecture[] | null {
    let lectureList: RefLecture[] = JSON.parse(str);
    if (!lectureList || typeof lectureList.length !== 'number') {
        return null;
    } else {
        lectureList;
    }
}

export async function setLectureListCache(year:number, semester:number, queryString: string, page: number, lectureList: RefLecture[]): Promise<void> {
    let key = RedisKeyUtil.getLectureQueryKey(year, semester, queryString, page);
    let lectureListString = JSON.stringify(lectureList);
    await RedisUtil.set(key, lectureListString);
}
