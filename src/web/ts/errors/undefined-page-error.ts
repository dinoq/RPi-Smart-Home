import { Pages } from "../html/utils/router";

export class UndefinedPageError extends Error {
    __proto__ = Error

    public page?: string;

    constructor(page: string) {
        super("Page " + page +" not defined!");
        Object.setPrototypeOf(this, UndefinedPageError.prototype);
    }
}