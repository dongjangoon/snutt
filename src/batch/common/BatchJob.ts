import BatchReader from "./BatchReader";
import BatchProcessor from "./BatchProcessor";
import BatchWriter from "./BatchWriter";

export default class BatchJob {
    constructor(public reader: BatchReader<any>,
        public processors: BatchProcessor<any, any>[],
        public writer: BatchWriter<any>) {
    }

    async run(): Promise<void> {
        await this.reader.open();
        while(true) {
            let item = await this.reader.read();
            if (item === null) break;
            await this.processItem(item);
        }
        await this.reader.close();
    }

    private async processItem(item): Promise<void> {
        for (let processor of this.processors) {
            item = await processor.process(item);
        }
        await this.writer.write(item);
    }
}