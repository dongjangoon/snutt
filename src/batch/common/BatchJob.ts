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

    protected async doRun(executionContext?): Promise<void> {
        await this.reader.open(executionContext);
        while(true) {
            let item = await this.reader.read(executionContext);
            if (item === null) break;
            await this.processItem(item, executionContext);
        }
        await this.reader.close(executionContext);
    }

    private async processItem(item, executionContext?): Promise<void> {
        for (let processor of this.processors) {
            item = await processor.process(item, executionContext);
        }
        await this.writer.write(item, executionContext);
    }
}