import { ErrorDialog } from "../components/dialogs/error-dialog.js";

export class BaseError{
    errMsg: string;    
    protected showImmediately: boolean;
    protected showInDialog: boolean = false;
    constructor(msg: string = "", caller, showImmediately: boolean = true) {
        if(caller){
            this.errMsg = "Error: '" + msg + "'\nAt class: " + caller.constructor.name;
        }else{
            this.errMsg = "Unknown Error";
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