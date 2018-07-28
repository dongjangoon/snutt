export default interface BatchWriter<T> {
    write(item: T): Promise<void>;
}
