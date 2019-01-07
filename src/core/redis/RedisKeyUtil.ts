export function getLectureQueryKey(queryHash: string, page: number) {
    return "lq-" + queryHash + "-" + page;
}
