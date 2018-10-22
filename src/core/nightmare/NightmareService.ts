import Nightmare = require('nightmare');
import AsyncLock = require('async-lock');

let nm = Nightmare({
    show: false,
    executionTimeout: 1000,
    waitTimeout: 1000
});

let nmLock = new AsyncLock({maxPending : 100, timeout: 5000});
const NM_LOCK_KEY = "NightmareServiceLock";

function execute<T>(f: (Nightmare) => Promise<T>): Promise<T> {
    return nmLock.acquire(NM_LOCK_KEY, function() {
        return f(nm);
    });
}

export function renderHtmlAsPng(html: string, width: number, height: number): Promise<Buffer> {
    return execute(async function(nm) {
        nm.viewport(width, height);
        nm.goto("about:blank");
        await nm.wait(function (html: string){
            document.body.innerHTML = html;
            return true;
        }, html);
        let buffer: Buffer = await nm.screenshot();
        return buffer;
    });
}
