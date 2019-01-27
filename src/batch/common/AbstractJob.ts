import winston = require('winston');
let logger = winston.loggers.get('default');

export default abstract class AbstractJob {
    constructor(
        public jobName: string
    ) { }

    public async run(executionContext?): Promise<void> {
        logger.info("Starting Job [" + this.jobName + "]");
        let startTime = process.hrtime();
        try {
            await this.doRun(executionContext);
            let timeMargin = process.hrtime(startTime);
            logger.info("Job [" + this.jobName + "] completed, took " + timeMargin[0] + "s");
        } catch (err) {
            logger.error(err);
            logger.info("Job [" + this.jobName + "] failed");
        }
    }

    protected abstract async doRun(executionContext?): Promise<void>;
}