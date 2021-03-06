import { ErrorDialog } from "../components/dialogs/error-dialog.js";
import { Config } from "../app/config.js";
import { AbstractError } from "./base-errors.js";
export class MethodNotImplementedError extends AbstractError {
    constructor(methodName = "", caller, showImmediately) {
        super("", caller, false);
        this.showInDialog = false;
        this.errMsg = "Error: Method '" + caller.constructor.name + "." + methodName + "()' not implemented\nAt class: " + caller.constructor.name;
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show(methodName);
        }
    }
    show(methodName = "") {
        let display = false;
        switch (methodName) {
            case "addListeners":
                display = Config.showAddListenersNotImplemented;
                break;
            case "connectedCallback":
                display = Config.showDisconnectedCallbackNotImplemented;
                break;
            case "disconnectedCallback":
                display = Config.showDisconnectedCallbackNotImplemented;
                break;
            default:
                break;
        }
        if (display) {
            console.error(this.errMsg);
            if (this.showInDialog) {
                let stringWithBR = this.errMsg.replaceAll("\n", "<br>");
                new ErrorDialog(stringWithBR, {});
            }
        }
    }
}
