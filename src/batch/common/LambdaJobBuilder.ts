import BatchReader from "./BatchReader";
import BatchProcessor from "./BatchProcessor";
import BatchWriter from "./BatchWriter";
import BatchJob from "./BatchJob";
import ArrayReader from "./ArrayReader";

class IntermediateJob<T> {
    _jobName: string;
    _reader: BatchReader<any>;
    _processors: BatchProcessor<any, any>[] = [];

    constructor(jobName:string, reader: (any?) => Promise<T[]>) {
        this._jobName = jobName;
        this._reader = new (class SimpleReader extends ArrayReader<T> {
            getItems(executionContext?) {
                return reader(executionContext);
            }
        });
    }

    processor<N>(processor: (T, any?) => Promise<N>): IntermediateJob<N> {
        this._processors.push(new (class SimpleProcessor implements BatchProcessor<T, N> {
            process(item, executionContext?) {
                return processor(item, executionContext);
            }
        }));
        return <any>this;
    }

    writer(writer: (T, any?) => Promise<void>): BatchJob {
        return new BatchJob(this._jobName, this._reader, this._processors, 
        new (class SimpleWriter implements BatchWriter<T> {
            write(item, executionContext?) {
                return writer(item, executionContext);
            }
        }));
    }
}

export default class LambdaJobBuilder {
    constructor(public jobName: string) {}
    reader<R>(reader: (any?) => Promise<R[]>) {
        return new IntermediateJob<R>(this.jobName, reader);
    }
}
