import { Config } from "../../app/config.js";
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
        overlay.style.width = Config.getWindowWidth(true);
        overlay.style.height = Config.getWindowHeight(true);
    }
}
export var DialogResponses;
(function (DialogResponses) {
    DialogResponses[DialogResponses["OK"] = 0] = "OK";
    DialogResponses[DialogResponses["CANCEL"] = 1] = "CANCEL";
    DialogResponses[DialogResponses["YES"] = 2] = "YES";
    DialogResponses[DialogResponses["NO"] = 3] = "NO";
})(DialogResponses || (DialogResponses = {}));
