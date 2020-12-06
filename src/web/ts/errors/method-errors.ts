import { BaseError } from "./base-error.js";

export class MethodNotImplementedError extends BaseError{
    protected showInDialog: boolean = false;
    constructor(methodName: string="", caller, showImmediately) {
        super("", caller, false);
        this.errMsg = "Error: Method '" + caller.constructor.name + "." + methodName + "()' not implemented\nAt class: " + caller.constructor.name;
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show();
        }
    }
}
