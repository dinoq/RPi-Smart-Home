export class UndefinedPageError extends Error {
    constructor(page) {
        super("Page " + page + " not defined!");
        this.__proto__ = Error;
        Object.setPrototypeOf(this, UndefinedPageError.prototype);
    }
}
