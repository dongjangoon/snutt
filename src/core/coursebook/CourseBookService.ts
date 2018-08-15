import CourseBookRepository = require('./CourseBookRepository');
import CourseBook from './model/CourseBook';

export function getAll(): Promise<CourseBook[]> {
    return CourseBookRepository.findAll();
}

export function getRecent(): Promise<CourseBook> {
    return CourseBookRepository.findRecent();
}

export function get(year: number, semester: number): Promise<CourseBook | null> {
    return CourseBookRepository.findByYearAndSemester(year, semester);
}

export function add(courseBook: CourseBook): Promise<void> {
    return CourseBookRepository.insert(courseBook);
}

export function modifyUpdatedAt(courseBook: CourseBook, updatedAt: Date): Promise<void> {
    courseBook.updated_at = updatedAt;
    return CourseBookRepository.update(courseBook);
}
