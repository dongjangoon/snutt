export default interface TagList {
  year: number;
  semester: number;
  updated_at?: number;
  tags: {
    classification: string[],
    department: string[],
    academic_year: string[],
    credit: string[],
    instructor: string[],
    category: string[],
    etc: string[]
  };
};
