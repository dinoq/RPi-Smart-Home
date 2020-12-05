export class BaseError {
    constructor(msg = "", caller, showImmediately = true) {
        this.errMsg = "Error: '" + msg + "'\nAt class: " + caller.constructor.name;
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
    show() {
        console.error(this.errMsg);
    }
}
