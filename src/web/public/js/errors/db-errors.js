import { DETAIL_FIELD_TYPES } from "../layouts/detail-component.js";
import { AbstractError } from "./base-error.js";
export class UnknownValueInDatabaseError extends AbstractError {
    constructor(value, inputType) {
        super("", null, false);
        this.showInDialog = true;
        this.errMsg = `Error: Uknown value (${value}) in database. Tried to set it to input: ${DETAIL_FIELD_TYPES[inputType]}`;
        this.showImmediately = true;
        if (this.showImmediately) {
            this.show();
        }
    }
}
