export default class RedisClientError extends Error {
    constructor(public msg: string) {
        super(msg);
    }
}
