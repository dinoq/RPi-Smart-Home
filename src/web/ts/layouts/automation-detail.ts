import { IComponentProperties } from "../components/component.js";
import { ListTypes } from "./list-component.js";
import { BaseDetail, DETAIL_FIELD_TYPES } from "./detail-component.js";

export class AutomationDetail extends BaseDetail {
    static tagName = "automation-detail";


    constructor(saveCallback, cancelCallback, layoutProps?: IComponentProperties) {
        super(saveCallback, cancelCallback, layoutProps);
        this.updateTitle("Pro editaci klikněte na.....");
    }


    getElementsToCreate(type: ListTypes): any[] {
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
