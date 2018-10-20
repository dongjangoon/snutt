export function getSyllabusUrl(year: number, semester: number, lectureNumber: number, courseNumber: number): string {
    let openShtmFg = makeOpenShtmFg(semester);
    let openDetaShtmFg = makeOpenDetaShtmFg(semester);
    return "http://sugang.snu.ac.kr/sugang/cc/cc103.action?openSchyy="+year+
        "&openShtmFg="+openShtmFg+"&openDetaShtmFg="+openDetaShtmFg+
        "&sbjtCd="+courseNumber+"&ltNo="+lectureNumber+"&sbjtSubhCd=000";
}

function makeOpenShtmFg(semester: number): string {
    switch (semester) {
    case 1:
        return "U000200001";
    case 2:
        return "U000200001";
    case 3:
        return "U000200002";
    case 4:
        return "U000200002";
    }
}

function makeOpenDetaShtmFg(semester: number): string {
    switch (semester) {
    case 1:
        return "U000300001";
    case 2:
        return "U000300002";
    case 3:
        return "U000300001";
    case 4:
        return "U000300002";
    }
}
