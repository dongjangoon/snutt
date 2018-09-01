export function getLectureQueryKey(year: number, semester: number, queryString: string, page: number) {
    return "lq-" + year + "-" + semester + "-" + page + "-" + queryString;
}
