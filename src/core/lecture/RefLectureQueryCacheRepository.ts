import RedisKeyUtil = require('@app/core/redis/RedisKeyUtil');
import RedisUtil = require('@app/core/redis/RedisUtil');
import RefLecture from './model/RefLecture';

export async function getLectureListCache(queryString: string): Promise<RefLecture[] | null> {
    let key = RedisKeyUtil.getLectureQueryKey(queryString);
    let lectureListString = await RedisUtil.get(key);
    let lectureList: RefLecture[] = JSON.parse(lectureListString);
    if (!lectureList || typeof lectureList.length !== 'number') {
        return null;
    }
    return lectureList;
}

export async function setLectureListCache(queryString: string, lectureList: RefLecture[]): Promise<void> {
    let key = RedisKeyUtil.getLectureQueryKey(queryString);
    let lectureListString = JSON.stringify(lectureList);
    await RedisUtil.set(key, lectureListString);
}
