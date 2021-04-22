import { DETAIL_FIELD_TYPES } from "../layouts/detail-component.js";
import { AbstractError } from "./base-errors.js";

export class UnknownValueInDatabaseError extends AbstractError{
    showInDialog: boolean = true;
    constructor(value: string, inputType: DETAIL_FIELD_TYPES) {
        super("", null, false);
        
        this.errMsg = `Error: Uknown value (${value}) in database. Tried to set it to input: ${DETAIL_FIELD_TYPES[inputType]}`;
        this.showImmediately = true;
        if(this.showImmediately){
            this.show();
        }
    }
}
