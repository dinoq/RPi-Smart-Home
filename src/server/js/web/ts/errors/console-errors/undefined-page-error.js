"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedPageError = void 0;
class UndefinedPageError extends Error {
    constructor(page) {
        super("Page " + page + " not defined!");
        this.__proto__ = Error;
        Object.setPrototypeOf(this, UndefinedPageError.prototype);
    }
}
exports.UndefinedPageError = UndefinedPageError;
