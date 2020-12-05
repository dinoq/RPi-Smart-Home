export class BaseError{
    errMsg: string;    
    showImmediately: boolean;
    constructor(msg: string = "", caller, showImmediately: boolean = true) {
        this.errMsg = "Error: '" + msg + "'\nAt class: " + caller.constructor.name;
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show();
        }
    }

    show(){
        console.error(this.errMsg);
    }
}