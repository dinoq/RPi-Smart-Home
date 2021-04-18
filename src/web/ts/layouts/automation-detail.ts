import { IComponentProperties } from "../components/component.js";
import { ListTypes } from "./list-component.js";
import { BaseDetail } from "./detail-component.js";

export class AutomationDetail extends BaseDetail {
    static tagName = "automation-detail";


    constructor(saveCallback, cancelCallback, layoutProps?: IComponentProperties) {
        super(saveCallback, cancelCallback, layoutProps);
        this.updateTitle("Pro editaci klikněte na.....");
    }

    getElementsToCreate(type: ListTypes): any[] {
        throw new Error("Method not implemented.");
    }

    updateDetail(title: string, type: ListTypes, values) {
    }


}
