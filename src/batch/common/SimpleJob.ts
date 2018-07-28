import AbstractJob from "./AbstractJob";

export default class SimpleJob extends AbstractJob {
    constructor(
        public jobName: string,
        private runner: () => Promise<void>
    ) {
        super(jobName);
    }

    protected doRun() {
        return this.runner();
    }
}