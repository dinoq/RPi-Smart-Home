import { BasePage } from "../pages/base-page.js";
import { BaseError } from "./base-error.js";

export class PageNotExistInPageManagerError extends BaseError{
    protected showInDialog: boolean = true;
    constructor(page: number | BasePage, length: number, showImmediately) {
        super("", null, false);
        let p = (typeof page == "number")? "Page with index '" + page: "Any page, instance of '" + page.constructor.name;
        let append = (typeof page == "number")? " PageManager contains only " + length 
                    + " pages, so max index is " + (length-1) + "." : "";
        this.errMsg = "Error: " + p + "' doesn't exist in PageManager." + append;
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show();
        }
    }
}

export class PageAlreadyAddedToPageManagerError extends BaseError{
    protected showInDialog: boolean = true;
    constructor(page: BasePage, showImmediately) {
        super("", null, false);
        this.errMsg = "Error: Any page, instance of '" + page.constructor.name + "' already added to PageManager!";
        this.showImmediately = showImmediately;
        if(showImmediately){
            this.show();
        }
    }
}
