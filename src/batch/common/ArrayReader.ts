import BatchReader from "./BatchReader";

export default abstract class ArrayReader<R> implements BatchReader<R> {
    index: number = 0;
    items: R[] = [];

    abstract async getItems(): Promise<R[]>;

    async open(): Promise<void> {
        this.items = await this.getItems();
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