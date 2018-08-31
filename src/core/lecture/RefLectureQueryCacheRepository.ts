import RedisKeyUtil = require('@app/core/redis/RedisKeyUtil');
import RedisUtil = require('@app/core/redis/RedisUtil');
import RefLecture from './model/RefLecture';

export async function getLectureListCache(year:number, semester:number, queryString: string, limit: number, offset: number): Promise<RefLecture[] | null> {
    let key = RedisKeyUtil.getLectureQueryKey(year, semester, queryString, limit, offset);
    let lectureListString = await RedisUtil.get(key);
    let lectureList: RefLecture[] = JSON.parse(lectureListString);
    if (!lectureList || typeof lectureList.length !== 'number') {
        return null;
    }
    return lectureList;
}

export async function setLectureListCache(year:number, semester:number, queryString: string, limit: number, offset: number, lectureList: RefLecture[]): Promise<void> {
    let key = RedisKeyUtil.getLectureQueryKey(year, semester, queryString, limit, offset);
    let lectureListString = JSON.stringify(lectureList);
    await RedisUtil.set(key, lectureListString);
}
