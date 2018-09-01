import RedisKeyUtil = require('@app/core/redis/RedisKeyUtil');
import RedisUtil = require('@app/core/redis/RedisUtil');
import log4js = require('log4js');
import RefLecture from './model/RefLecture';
let logger = log4js.getLogger();

export async function getLectureListCache(year:number, semester:number, queryString: string, page: number): Promise<RefLecture[] | null> {
    let key = RedisKeyUtil.getLectureQueryKey(year, semester, queryString, page);
    let lectureListString = await RedisUtil.get(key);
    let lectureList: RefLecture[] = JSON.parse(lectureListString);
    if (!lectureList || typeof lectureList.length !== 'number') {
        return null;
    }
    return lectureList;
}

export async function setLectureListCache(year:number, semester:number, queryString: string, page: number, lectureList: RefLecture[]): Promise<void> {
    let key = RedisKeyUtil.getLectureQueryKey(year, semester, queryString, page);
    let lectureListString = JSON.stringify(lectureList);
    await RedisUtil.set(key, lectureListString);
}
