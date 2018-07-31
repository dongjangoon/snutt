export default interface BatchReader<T> {
    open(executionContext?): Promise<void>;
    close(executionContext?): Promise<void>;
    read(executionContext?): Promise<T>;
}
