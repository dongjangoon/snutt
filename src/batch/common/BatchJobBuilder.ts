import BatchReader from "./BatchReader";
import BatchProcessor from "./BatchProcessor";
import BatchWriter from "./BatchWriter";
import BatchJob from "./BatchJob";

class IntermediateJob<T> {
    _jobName: string;
    _reader: BatchReader<any>;
    _processors: BatchProcessor<any, any>[] = [];

    constructor(jobName: string, reader: BatchReader<T>) {
        this._jobName = jobName;
        this._reader = reader;
    }

    processor<N>(processor: BatchProcessor<T, N>): IntermediateJob<N> {
        this._processors.push(processor);
        return <any>this;
    }

    writer(writer: BatchWriter<T>): BatchJob {
        return new BatchJob(this._jobName, this._reader, this._processors, writer);
    }
}

export default class BatchJobBuilder {
    constructor(public jobName: string) { }

    reader<R>(reader: BatchReader<R>) {
        return new IntermediateJob<R>(this.jobName, reader);
    }
}