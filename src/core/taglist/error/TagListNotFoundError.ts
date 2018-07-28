export default class TagListNotFoundError extends Error {
    constructor() {
        super("Tag not found");
    }
}
