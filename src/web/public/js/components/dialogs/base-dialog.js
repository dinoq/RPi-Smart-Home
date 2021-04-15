import { Utils } from "../../app/utils.js";
import { AbstractComponent } from "../component.js";
export class BaseDialog extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.classList.add("dialog-wrapper");
        this.overlayContainer = document.createElement("div");
        this.overlayContainer.innerHTML = `
            <div class="overlay">
            </div>
        `;
        let overlay = this.overlayContainer.querySelector(".overlay");
        overlay.style.width = Utils.getWindowWidth(true);
        overlay.style.height = Utils.getWindowHeight(true);
    }
    changeText(text) {
        let msgBox = this.querySelector(".message-box");
        if (msgBox) {
            msgBox.innerHTML = text; // we are using innerHTML for case of HTML formated text...
        }
    }
}
export var DialogResponses;
(function (DialogResponses) {
    DialogResponses[DialogResponses["OK"] = 0] = "OK";
    DialogResponses[DialogResponses["CANCEL"] = 1] = "CANCEL";
    DialogResponses[DialogResponses["YES"] = 2] = "YES";
    DialogResponses[DialogResponses["NO"] = 3] = "NO";
})(DialogResponses || (DialogResponses = {}));
