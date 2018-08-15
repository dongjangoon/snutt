import AbstractJob from "./AbstractJob";

export default class SimpleJob extends AbstractJob {
    constructor(
        public jobName: string,
        private runner: (any?) => Promise<void>
    ) {
        super(jobName);
    }

    protected doRun(executionContext?) {
        return this.runner(executionContext);
    }
}