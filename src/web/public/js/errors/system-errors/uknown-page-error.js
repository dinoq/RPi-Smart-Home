export class UnknownPageError extends Error {
    constructor() {
        super("UNKNOWN page returned!");
        this.__proto__ = Error;
        Object.setPrototypeOf(this, UnknownPageError.prototype);
    }
}
