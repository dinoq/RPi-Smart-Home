import { Detail } from "./detail-component.js";
export class AutomationDetail extends Detail {
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
AutomationDetail.tagName = "settings-detail";
