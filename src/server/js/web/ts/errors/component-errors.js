"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentNameNotDefinedError = exports.CustomComponentNotDefinedError = void 0;
const base_errors_js_1 = require("./base-errors.js");
class CustomComponentNotDefinedError extends base_errors_js_1.AbstractError {
    constructor(errorStackClasses) {
        super("", null, false);
        this.showInDialog = true;
        let componentClassName = errorStackClasses[errorStackClasses.indexOf("PageCreator") - 1];
        this.errMsg = "Error: Component created by '" + componentClassName +
            "' class not defined (not registered as custom HTML element).\n" +
            "See 'registerAllComponents()' method of main app class (probably class '" + errorStackClasses[errorStackClasses.length - 1] + "').\n" +
            "Maybe only is not specified static property tagName in component's class.\n" +
            "At class: " + errorStackClasses[0];
        this.showImmediately = true;
        if (this.showImmediately) {
            this.show();
        }
    }
}
exports.CustomComponentNotDefinedError = CustomComponentNotDefinedError;
class ComponentNameNotDefinedError extends base_errors_js_1.AbstractError {
    constructor() {
        super("", null, false);
        this.showInDialog = false;
        this.errMsg = "Component name or className not defined!";
        this.showImmediately = true;
        if (this.showImmediately) {
            this.show();
        }
    }
}
exports.ComponentNameNotDefinedError = ComponentNameNotDefinedError;
