import log4js = require('log4js');
let logger = log4js.getLogger();

export default abstract class AbstractJob {
    constructor(
        public jobName: string
    ) { }

    public async run(): Promise<void> {
        logger.info("Starting Job [" + this.jobName + "]");
        let startTime = process.hrtime();
        await this.doRun();
        let timeMargin = process.hrtime(startTime);
        logger.info("Job [" + this.jobName + "] completed, took " + timeMargin[0] + "s");
    }

    protected abstract async doRun(): Promise<void>;
}