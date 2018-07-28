import BatchReader from "./BatchReader";
import BatchProcessor from "./BatchProcessor";
import BatchWriter from "./BatchWriter";
import AbstractJob from "./AbstractJob";

export default class BatchJob extends AbstractJob {
    constructor(
        public jobName: string,
        private reader: BatchReader<any>,
        private processors: BatchProcessor<any, any>[],
        private writer: BatchWriter<any>
    ) {
        super(jobName);
    }

    protected async doRun(): Promise<void> {
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