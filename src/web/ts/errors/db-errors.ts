import { INPUT_TYPES } from "../layouts/frame-detail.js";
import { BaseError } from "./base-error.js";

export class UnknownValueInDatabaseError extends BaseError{
    showInDialog: boolean = true;
    constructor(value: string, inputType: INPUT_TYPES) {
        super("", null, false);
        
        this.errMsg = `Error: Uknown value (${value}) in database. Tried to set it to input: ${INPUT_TYPES[inputType]}`;
        this.showImmediately = true;
        if(this.showImmediately){
            this.show();
        }
    }
}
