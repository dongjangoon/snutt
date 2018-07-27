import BatchReader from "./BatchReader";
import BatchProcessor from "./BatchProcessor";
import BatchWriter from "./BatchWriter";
import BatchJob from "./BatchJob";
import ArrayReader from "./ArrayReader";

class IntermediateJob<T> {
    _reader: BatchReader<any>;
    _processors: BatchProcessor<any, any>[];

    constructor(reader: () => Promise<T[]>) {
        this._reader = new (class SimpleReader extends ArrayReader<T> {
            getItems() {
                return reader();
            }
        });
    }

    processor<N>(processor: (T) => Promise<N>): IntermediateJob<N> {
        this._processors.push(new (class SimpleProcessor implements BatchProcessor<T, N> {
            process(item) {
                return processor(item);
            }
        }));
        return <any>this;
    }

    writer(writer: (T) => Promise<void>): BatchJob {
        return new BatchJob(this._reader, this._processors, 
        new (class SimpleWriter implements BatchWriter<T> {
            write(item) {
                return writer(item);
            }
        }));
    }
}

export default class LambdaJobBuilder {
    static reader<R>(reader: () => Promise<R[]>) {
        return new IntermediateJob<R>(reader);
    }
}
