import { ErrorDialog } from "../components/dialogs/error-dialog.js";
import { Config } from "../utils/config.js";
import { BaseError } from "./base-error.js";

export class MethodNotImplementedError extends BaseError{
    protected showInDialog: boolean = false;
    constructor(methodName: string="", caller, showImmediately) {
        super("", caller, false);
        this.errMsg = "Error: Method '" + caller.constructor.name + "." + methodName + "()' not implemented\nAt class: " + caller.constructor.name;
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show(methodName);
        }
    }

    show(methodName: string=""){
        let display = true;
        switch (methodName) {
            case "addListeners":
                display = Config.showAddListenersNotImplemented
                break;
            case "connectedCallback":
                display = Config.showDisconnectedCallbackNotImplemented
                break;        
            case "disconnectedCallback":
                display = Config.showDisconnectedCallbackNotImplemented
                break;    
            default:
                break;
        }
        if(display){
            console.error(this.errMsg);
            if(this.showInDialog){
                let stringWithBR = this.errMsg.replaceAll("\n", "<br>");
                new ErrorDialog(stringWithBR, {});
            }
        }
    }
}
