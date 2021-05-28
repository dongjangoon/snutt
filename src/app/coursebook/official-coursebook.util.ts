export function getSyllabusUrl(
  year: string,
  semester: number,
  lectureNumber: string,
  courseNumber: string,
): string {
  const openShtmFg = makeOpenShtmFg(semester)
  const openDetaShtmFg = makeOpenDetaShtmFg(semester)
  return (
    'http://sugang.snu.ac.kr/sugang/cc/cc103.action?openSchyy=' +
    year +
    '&openShtmFg=' +
    openShtmFg +
    '&openDetaShtmFg=' +
    openDetaShtmFg +
    '&sbjtCd=' +
    courseNumber +
    '&ltNo=' +
    lectureNumber +
    '&sbjtSubhCd=000'
  )
}

function makeOpenShtmFg(semester: number): string {
  switch (semester) {
    case 1:
      return 'U000200001'
    case 2:
      return 'U000200001'
    case 3:
      return 'U000200002'
    case 4:
      return 'U000200002'
    default:
      return ''
  }
}

function makeOpenDetaShtmFg(semester: number): string {
  switch (semester) {
    case 1:
      return 'U000300001'
    case 2:
      return 'U000300002'
    case 3:
      return 'U000300001'
    case 4:
      return 'U000300002'
    default:
      return ''
  }
}
