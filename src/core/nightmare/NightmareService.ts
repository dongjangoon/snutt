import Nightmare = require('nightmare');
import AsyncLock = require('async-lock');
import log4js = require('log4js');
let logger = log4js.getLogger();

let nm = Nightmare({
    show: false,
    executionTimeout: 1000,
    waitTimeout: 1000
});

nm.on('console', function(log, msg) {
    logger.info("console msg: " + msg);
});

let nmLock = new AsyncLock({maxPending : 100, timeout: 5000});
const NM_LOCK_KEY = "NightmareServiceLock";

/**
 * 하나의 Nightmare 객체를 공유하므로 lock을 사용해야 한다.
 */
function execute<T>(f: (Nightmare) => Promise<T>): Promise<T> {
    return nmLock.acquire(NM_LOCK_KEY, function() {
        return f(nm);
    });
}

export function renderHtmlAsPng(html: string, width: number, height: number): Promise<Buffer> {
    return execute(async function(nm) {
        let printMessageAfterSecond: any;
        nm.viewport(width, height);
        nm.goto("data:text/html;charset=utf-8," + html);
        await nm.wait(function(){ return true; }); // HTML 전체 로딩까지 대기
        let result = await nm.evaluate(function(msg) {
            return printMessageAfterSecond(msg);
        }, "abcd");

        logger.info("function result: " + result);
        let buffer: Buffer = await nm.screenshot();
        return buffer;
    });
}
