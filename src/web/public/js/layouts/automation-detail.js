import { BaseDetail } from "./detail-component.js";
export class AutomationDetail extends BaseDetail {
    constructor(saveCallback, cancelCallback, layoutProps) {
        super(saveCallback, cancelCallback, layoutProps);
        this.updateTitle("Pro editaci klikněte na.....");
    }
    getElementsToCreate(type) {
        throw new Error("Method not implemented.");
    }
    updateDetail(title, type, values) {
    }
}
AutomationDetail.tagName = "automation-detail";
