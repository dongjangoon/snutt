import BatchReader from "./BatchReader";

export default abstract class ArrayReader<R> implements BatchReader<R> {
    index: number = 0;
    items: R[] = [];

    abstract async getItems(executionContext?): Promise<R[]>;

    async open(executionContext?): Promise<void> {
        this.items = await this.getItems(executionContext);
    }
    async close() { }
    async read() {
        if (this.index < this.items.length) {
            return this.items[this.index++];
        } else {
            return null;
        }
    }
}