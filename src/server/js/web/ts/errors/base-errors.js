"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDialogError = exports.BaseSingletonDialogError = exports.BaseConsoleError = exports.AbstractError = void 0;
const error_dialog_js_1 = require("../components/dialogs/error-dialog.js");
class AbstractError {
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
            new error_dialog_js_1.ErrorDialog(stringWithBR, {});
        }
    }
}
exports.AbstractError = AbstractError;
class BaseConsoleError extends AbstractError {
    constructor(msg = "", caller, showImmediately = true) {
        super(msg, caller, showImmediately);
        this.showInDialog = false;
    }
}
exports.BaseConsoleError = BaseConsoleError;
class BaseSingletonDialogError extends AbstractError {
    constructor(msg = "", caller, showImmediately = true) {
        super(msg, caller, false);
        this.showInDialog = true;
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
}
exports.BaseSingletonDialogError = BaseSingletonDialogError;
class BaseDialogError {
    constructor(errorMsg = "", caller, showImmediately = true) {
        let allDialogs = document.querySelectorAll(error_dialog_js_1.ErrorDialog.tagName);
        let exists = Array.from(allDialogs).some((dialog, index, array) => {
            return dialog.querySelector(".error-message").innerText.includes(errorMsg);
        });
        if (!exists) {
            this.dialog = new BaseSingletonDialogError(errorMsg, caller, showImmediately);
        }
    }
}
exports.BaseDialogError = BaseDialogError;
