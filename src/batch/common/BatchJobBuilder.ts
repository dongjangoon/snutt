import BatchReader from "./BatchReader";
import BatchProcessor from "./BatchProcessor";
import BatchWriter from "./BatchWriter";
import BatchJob from "./BatchJob";

class IntermediateJob<T> {
    _reader: BatchReader<any>;
    _processors: BatchProcessor<any, any>[] = [];

    constructor(reader: BatchReader<T>) {
        this._reader = reader;
    }

    processor<N>(processor: BatchProcessor<T, N>): IntermediateJob<N> {
        this._processors.push(processor);
        return <any>this;
    }

    writer(writer: BatchWriter<T>): BatchJob {
        return new BatchJob(this._reader, this._processors, writer);
    }
}

export default class BatchJobBuilder {
    static reader<R>(reader: BatchReader<R>) {
        return new IntermediateJob<R>(reader);
    }
}