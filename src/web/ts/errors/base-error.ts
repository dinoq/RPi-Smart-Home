import { ErrorDialog } from "../components/dialogs/error-dialog.js";

export abstract class AbstractError{
    errMsg: string;    
    protected showImmediately: boolean;
    protected showInDialog: boolean = false;
    constructor(msg: string = "", caller, showImmediately: boolean = true) {
        if(caller){
            if(typeof caller == "string"){
                this.errMsg = "Error: " + msg + "'\nAt class: '" + caller + "'";
            }else{
                this.errMsg = "Error: " + msg + "'\nAt class: '" + caller.constructor.name + "'";
            }
        }else{
            this.errMsg = "Error: " + msg + "\nAt unknown class";
        }
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show();
        }
    }

    show(){
        console.error(this.errMsg);
        if(this.showInDialog){
            let stringWithBR = this.errMsg.replaceAll("\n", "<br>");
            new ErrorDialog(stringWithBR, {});
        }
    }
}

export class BaseConsoleError extends AbstractError{
    errMsg: string;    
    protected showImmediately: boolean;
    protected showInDialog: boolean = false;
    constructor(msg: string = "", caller, showImmediately: boolean = true) {
        super(msg, caller, showImmediately);
    }
}

export class BaseDialogError extends AbstractError{
    errMsg: string;    
    protected showImmediately: boolean;
    protected showInDialog: boolean = true;
    constructor(msg: string = "", caller, showImmediately: boolean = true) {
        super(msg, caller, false);
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show();
        }
    }
}