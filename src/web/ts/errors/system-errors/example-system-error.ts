import { Pages } from "../../utils/router.js";

export class ExampleSystemError extends Error {
    __proto__ = Error

    public page?: string; //custom param

    constructor(page: string) {
        super("Page " + page +" not defined!"); //error message example
        Object.setPrototypeOf(this, ExampleSystemError.prototype);
    }
}