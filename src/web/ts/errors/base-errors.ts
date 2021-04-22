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
export class BaseSingletonDialogError extends AbstractError{
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


export class BaseDialogError {
    dialog;
    constructor(errorMsg: string = "", caller, showImmediately: boolean = true) {
        let allDialogs = document.querySelectorAll(ErrorDialog.tagName);
        let exists = Array.from(allDialogs).some((dialog: HTMLElement, index, array) => {
            return (<HTMLElement>dialog.querySelector(".error-message")).innerText.includes(errorMsg);
        })

        if(!exists){
            this.dialog = new BaseSingletonDialogError(errorMsg, caller, showImmediately);
        }
    }
}
