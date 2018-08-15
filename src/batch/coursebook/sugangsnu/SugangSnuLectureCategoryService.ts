enum LectureCategory {
    FOUNDATION_WRITING = 40,
    FOUNDATION_LANGUAGE = 41,
    FOUNDATION_MATH = 42,
    FOUNDATION_SCIENCE = 43,
    FOUNDATION_COMPUTER = 44,
    KNOWLEDGE_LITERATURE = 45,
    KNOWLEDGE_ART = 46,
    KNOWLEDGE_HISTORY = 47,
    KNOWLEDGE_POLITICS = 48,
    KNOWLEDGE_HUMAN = 49,
    KNOWLEDGE_NATURE = 50,
    KNOWLEDGE_LIFE = 51,
    GENERAL_PHYSICAL = 52,
    GENERAL_ART = 53,
    GENERAL_COLLEGE = 54,
    GENERAL_CREATIVITY = 55,
    GENERAL_KOREAN = 56,
}

export const lectureCategoryList: number[] = Object.keys(LectureCategory)
    .map(k => LectureCategory[k])
    .filter(v => typeof v === "number") as number[];

const lectureCategoryString = {
    [LectureCategory.FOUNDATION_WRITING]: "사고와 표현",
    [LectureCategory.FOUNDATION_LANGUAGE]: "외국어",
    [LectureCategory.FOUNDATION_MATH]: "수량적 분석과 추론",
    [LectureCategory.FOUNDATION_SCIENCE]: "과학적 사고와 실험",
    [LectureCategory.FOUNDATION_COMPUTER]: "컴퓨터와 정보 활용",
    [LectureCategory.KNOWLEDGE_LITERATURE]: "언어와 문학",
    [LectureCategory.KNOWLEDGE_ART]: "문화와 예술",
    [LectureCategory.KNOWLEDGE_HISTORY]: "역사와 철학",
    [LectureCategory.KNOWLEDGE_POLITICS]: "정치와 경제",
    [LectureCategory.KNOWLEDGE_HUMAN]: "인간과 사회",
    [LectureCategory.KNOWLEDGE_NATURE]: "자연과 기술",
    [LectureCategory.KNOWLEDGE_LIFE]: "생명과 환경",
    [LectureCategory.GENERAL_PHYSICAL]: "체육",
    [LectureCategory.GENERAL_ART]: "예술실기",
    [LectureCategory.GENERAL_COLLEGE]: "대학과 리더쉽",
    [LectureCategory.GENERAL_CREATIVITY]: "창의와 융합",
    [LectureCategory.GENERAL_KOREAN]: "한국의 이해"
};

export function getLectureCategoryString(lectureCategory: number) {
    return lectureCategoryString[lectureCategory];
}
