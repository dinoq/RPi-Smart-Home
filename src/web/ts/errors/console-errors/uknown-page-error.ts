import { Pages } from "../../app/app-router.js";

export class UnknownPageError extends Error {
    __proto__ = Error

    constructor() {
        super("UNKNOWN page returned!");
        Object.setPrototypeOf(this, UnknownPageError.prototype);
    }
}