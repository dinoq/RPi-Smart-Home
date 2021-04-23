import { ListTypes } from "./list-component.js";
import { BaseDetail, DETAIL_FIELD_TYPES } from "./detail-component.js";
export class AutomationDetail extends BaseDetail {
    constructor(saveCallback, cancelCallback, layoutProps) {
        super(saveCallback, cancelCallback, layoutProps);
        this.updateTitle("Pro editaci klikněte na.....");
    }
    getElementsToCreate(type) {
        let elementsToCreate = [];
        if (type == ListTypes.TIMEOUT) {
            elementsToCreate = [
                ["timeout-name", "Název časovače", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["time", "Doba za jakou akce nastane", DETAIL_FIELD_TYPES.TEXT_FIELD],
            ];
        }
        return elementsToCreate;
    }
}
AutomationDetail.tagName = "automation-detail";
