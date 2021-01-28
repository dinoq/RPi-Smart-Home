export class ExampleSystemError extends Error {
    constructor(page) {
        super("Page " + page + " not defined!"); //error message example
        this.__proto__ = Error;
        Object.setPrototypeOf(this, ExampleSystemError.prototype);
    }
}
