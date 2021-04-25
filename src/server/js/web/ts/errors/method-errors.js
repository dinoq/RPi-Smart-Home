"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodNotImplementedError = void 0;
const error_dialog_js_1 = require("../components/dialogs/error-dialog.js");
const config_js_1 = require("../app/config.js");
const base_errors_js_1 = require("./base-errors.js");
class MethodNotImplementedError extends base_errors_js_1.AbstractError {
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
                display = config_js_1.Config.showAddListenersNotImplemented;
                break;
            case "connectedCallback":
                display = config_js_1.Config.showDisconnectedCallbackNotImplemented;
                break;
            case "disconnectedCallback":
                display = config_js_1.Config.showDisconnectedCallbackNotImplemented;
                break;
            default:
                break;
        }
        if (display) {
            console.error(this.errMsg);
            if (this.showInDialog) {
                let stringWithBR = this.errMsg.replaceAll("\n", "<br>");
                new error_dialog_js_1.ErrorDialog(stringWithBR, {});
            }
        }
    }
}
exports.MethodNotImplementedError = MethodNotImplementedError;
