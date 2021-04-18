import { Detail } from "./detail-component.js";
export class SettingsDetail extends Detail {
    constructor(saveCallback, cancelCallback, layoutProps) {
        super(saveCallback, cancelCallback, layoutProps);
        this.initialize(saveCallback, cancelCallback);
    }
    initialize(saveCallback, cancelCallback) {
    }
    updateTitle(title) {
        this.querySelector(".editing-name").innerText = title;
    }
    updateDetail(title, type, values) {
    }
}
SettingsDetail.tagName = "settings-detail";
