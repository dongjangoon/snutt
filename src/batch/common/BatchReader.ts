export default interface BatchReader<T> {
    open(): Promise<void>;
    close(): Promise<void>;
    read(): Promise<T>;
}
