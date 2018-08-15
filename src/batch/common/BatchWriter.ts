export default interface BatchWriter<T> {
    write(item: T, executionContext?): Promise<void>;
}
