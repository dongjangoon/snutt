import TagListRepository = require('./TagListRepository');
import TagList from './model/TagList';

export function getBySemester(year: number, semester: number): Promise<TagList> {
    return TagListRepository.findBySemester(year, semester);
}

export function getUpdateTimeBySemester(year: number, semester: number): Promise<number> {
    return TagListRepository.findUpdateTimeBySemester(year, semester);
}

export function merge(tagList: TagList): Promise<void> {
    return TagListRepository.upsert(tagList);
}
