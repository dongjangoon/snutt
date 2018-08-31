export function getLectureQueryKey(year: number, semester: number, queryString: string, limit: number, offset: number) {
    return "lq-" + year + "-" + semester + "-" + limit + "-" + offset + "-" + queryString;
}
