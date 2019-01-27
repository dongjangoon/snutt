import EtcTagEnum from "@app/core/taglist/model/EtcTagEnum";
import winston = require('winston');
let logger = winston.loggers.get('default');

export function getMQueryFromEtcTagList(etcTags: string[]): any {
    let andQueryList = etcTags.map(getMQueryFromEtcTag).filter(x => x !== null);
    return { $and: andQueryList };
}

export function getMQueryFromEtcTag(etcTag: string): object | null {
    switch (etcTag) {
        case EtcTagEnum.ENGLISH_LECTURE:
            return {remark: {$regex: ".*ⓔ.*", $options: 'i'}};
        case EtcTagEnum.MILITARY_REMOTE_LECTURE:
            return {remark: {$regex: ".*ⓜⓞ.*", $options: 'i'}};
        default:
            logger.error("Unknown etc tag :", etcTag);
            return null;
    }
}
