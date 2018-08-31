export function getLectureQueryKey(year: number, semester: number, queryString: string) {
    return "lq-" + year + "-" + semester + "-" + queryString;
}
