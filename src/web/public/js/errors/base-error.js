import { ErrorDialog } from "../components/dialogs/error-dialog.js";
export class BaseError {
    constructor(msg = "", caller, showImmediately = true) {
        this.showInDialog = false;
        if (caller) {
            this.errMsg = "Error: '" + msg + "'\nAt class: " + caller.constructor.name;
        }
        else {
            this.errMsg = "Unknown Error";
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
