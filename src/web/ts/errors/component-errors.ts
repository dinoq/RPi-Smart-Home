import { AbstractError } from "./base-errors.js";

export class CustomComponentNotDefinedError extends AbstractError{
    showInDialog: boolean = true;
    constructor(errorStackClasses: Array<string>) {
        super("", null, false);
        let componentClassName = errorStackClasses[errorStackClasses.indexOf("PageCreator")-1];
        
        this.errMsg = "Error: Component created by '" + componentClassName  + 
        "' class not defined (not registered as custom HTML element).\n" + 
        "See 'registerAllComponents()' method of main app class (probably class '" + errorStackClasses[errorStackClasses.length-1] + "').\n" +
        "Maybe only is not specified static property tagName in component's class.\n" + 
        "At class: " + errorStackClasses[0];
        this.showImmediately = true;
        if(this.showImmediately){
            this.show();
        }
    }
}

export class ComponentNameNotDefinedError extends AbstractError{
    protected showInDialog: boolean = false;
    constructor() {
        super("", null, false);
        this.errMsg = "Component name or className not defined!";
        this.showImmediately = true;
        if(this.showImmediately){
            this.show();
        }
    }
}