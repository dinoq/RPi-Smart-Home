import { ErrorDialog } from "../components/dialogs/error-dialog.js";
export class AbstractError {
    constructor(msg = "", caller, showImmediately = true) {
        this.showInDialog = false;
        if (caller) {
            if (typeof caller == "string") {
                this.errMsg = "Error: " + msg + "'\nAt class: '" + caller + "'";
            }
            else {
                this.errMsg = "Error: " + msg + "'\nAt class: '" + caller.constructor.name + "'";
            }
        }
        else {
            this.errMsg = "Error: " + msg + "\nAt unknown class";
        }
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
    show() {
        console.error(this.errMsg);
        if (this.showInDialog) {
            let stringWithBR = this.errMsg.replaceAll("\n", "<br>");
            new ErrorDialog(stringWithBR, {});
        }
    }
}
export class BaseConsoleError extends AbstractError {
    constructor(msg = "", caller, showImmediately = true) {
        super(msg, caller, showImmediately);
        this.showInDialog = false;
    }
}
export class BaseDialogError extends AbstractError {
    constructor(msg = "", caller, showImmediately = true) {
        super(msg, caller, false);
        this.showInDialog = true;
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
}
