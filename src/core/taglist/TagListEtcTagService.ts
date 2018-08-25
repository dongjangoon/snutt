import EtcTagEnum from "./model/EtcTagEnum";

export function getEtcTagList(): string[] {
    return Object.keys(EtcTagEnum).filter(key => !isNaN(Number(EtcTagEnum[key])));
}
